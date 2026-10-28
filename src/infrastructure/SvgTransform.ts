import { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';
import { CommandArguments } from '../application/CommandArguments.js';

/** Positive uniform scale + translation, composed in SVG matrix order. */
export class SvgTransform {
  public constructor(private readonly factor = 1, private readonly dx = 0, private readonly dy = 0) {
    if (![factor, dx, dy].every(Number.isFinite) || factor <= 0) throw new Error('invalid SVG transform');
  }
  public static parse(source = '', css = false): SvgTransform {
    if (source.trim() === 'none') return new SvgTransform();
    if (/^\s*,|,\s*,|,\s*$/.test(source)) throw new Error('invalid transform separator');
    let result = new SvgTransform();
    let index = 0;
    while (index < source.length) {
      const space = /^[\s,]+/.exec(source.slice(index));
      if (space) { index += space[0].length; continue; }
      const operation = /^(translate|scale)\s*\(([^()]*)\)/.exec(source.slice(index));
      if (!operation) throw new Error('unsupported or invalid transform; expected translate or positive uniform scale');
      const rawValues = operation[2]!.trim().split(/[\s,]+/);
      const values = rawValues.map(value => {
        if (!css || operation[1] !== 'translate') return value;
        if (value.endsWith('px')) return value.slice(0, -2);
        if (Number(value) === 0) return value;
        throw new Error('CSS translate lengths must use px');
      });
      const args = new CommandArguments(values, 'SVG transform'); args.count(1, 2);
      const first = args.number(0), second = values.length === 2 ? args.number(1) : undefined;
      // This parses transform syntax, not shape type names.
      const next = operation[1] === 'translate'
        ? new SvgTransform(1, first, second ?? 0)
        : new SvgTransform(first);
      if (operation[1] === 'scale' && second !== undefined && second !== first) throw new Error('non-uniform scale is not supported');
      result = result.compose(next);
      index += operation[0].length;
    }
    return result;
  }
  public compose(inner: SvgTransform): SvgTransform {
    return new SvgTransform(this.factor * inner.factor, this.dx + this.factor * inner.dx, this.dy + this.factor * inner.dy);
  }
  public normalize(shape: Shape, inherited: Readonly<Record<string, string>>): void {
    if (shape instanceof Group) return;
    shape.scale(this.factor); shape.move(this.dx, this.dy);
    if (this.factor !== 1) {
      const width = this.length(inherited['stroke-width'] ?? '1') * this.factor;
      shape.set('stroke-width', String(width));
      const dash = inherited['stroke-dasharray'];
      if (dash !== undefined && dash !== 'none') {
        shape.importPresentation('stroke-dasharray', dash.trim().split(/[\s,]+/)
          .map(value => String(this.length(value) * this.factor)).join(' '));
      }
      if (inherited['stroke-dashoffset'] !== undefined) {
        shape.importPresentation('stroke-dashoffset', String(this.length(inherited['stroke-dashoffset']) * this.factor));
      }
      if (shape.content !== undefined) {
        const size = this.length(inherited['font-size'] ?? '16') * this.factor;
        shape.importPresentation('font-size', String(size));
      }
    }
  }
  private length(value: string): number {
    return new CommandArguments([value.replace(/px$/, '')], 'SVG style length').number(0);
  }
}
