import { Shape } from '../domain/Shape.js';
import { CommandArguments } from './CommandArguments.js';

/** Adapts CLI arguments or imported SVG attributes to the single shape factory. */
export class ShapeInput {
  private constructor(
    private readonly type: string,
    private readonly params: readonly string[],
    private readonly quoted: readonly boolean[] | undefined,
    private readonly svg: Readonly<Record<string, string>> | undefined,
    private readonly text: string,
  ) {}
  public static cli(type: string, params: readonly string[], quoted?: readonly boolean[]): ShapeInput {
    return new ShapeInput(type, params, quoted, undefined, '');
  }
  public static svg(type: string, attributes: Readonly<Record<string, string>>, content: string): ShapeInput {
    return new ShapeInput(type, [], undefined, attributes, content);
  }
  public count(min: number, max = min): void { if (!this.svg) this.arguments.count(min, max); }
  public number(index: number, name: string): number {
    if (!this.svg) return this.arguments.number(index);
    const raw = this.svg[name] ?? '0';
    return new CommandArguments([raw.replace(/px$/, '')], `SVG ${name}`).number(0);
  }
  public content(): string {
    if (this.svg) return this.text;
    if (this.quoted && !this.quoted[2]) throw new Error('text content must be enclosed in double quotes');
    return this.arguments.at(2);
  }
  public finish(shape: Shape, styleIndex?: number, styleName = 'fill'): Shape {
    if (!this.svg) {
      const style = styleIndex === undefined ? undefined : this.params[styleIndex];
      if (style !== undefined) shape.set(styleName, style);
      return shape;
    }
    const geometry = new Set(Object.keys(shape.attributes).filter(key => key !== 'text'));
    for (const [name, value] of Object.entries(this.svg)) {
      if (name === 'id' || geometry.has(name)) continue;
      if (['fill', 'stroke', 'stroke-width'].includes(name)) {
        shape.set(name, name === 'stroke-width' ? value.replace(/px$/, '') : value);
      } else shape.importPresentation(name, value);
    }
    return shape;
  }
  private get arguments(): CommandArguments {
    return new CommandArguments(this.params, `create ${this.type} <id> <geometry...> [style] [in <containerId>]`);
  }
}
