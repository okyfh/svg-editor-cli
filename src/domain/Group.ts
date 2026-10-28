import { Memento } from './Memento.js';
import { Shape } from './Shape.js';

/** Child mutation is kept inside the document aggregate via a domain-internal capability. */
export class Group extends Shape {
  #children: Shape[] = [];
  public constructor(id: string) { super(id); }
  public override get type(): string { return 'g'; }
  public override get children(): readonly Shape[] { return Object.freeze([...this.#children]); }
  protected override get geometryAttributes(): Readonly<Record<string, number>> { return {}; }
  public override capture(): Memento {
    const base = super.capture();
    const children = [...this.#children];
    const states = children.map(child => child.capture());
    return new Memento(() => {
      base.restore(); this.#children = [...children];
      for (const state of states) state.restore();
    });
  }
  public override validateMove(dx: number, dy: number): void {
    this.number(dx); this.number(dy);
    for (const child of this.#children) child.validateMove(dx, dy);
  }
  public override validateScale(factor: number): void {
    this.positiveFactor(factor);
    for (const child of this.#children) child.validateScale(factor);
  }
  public override move(dx: number, dy: number): void {
    this.validateMove(dx, dy);
    for (const child of this.#children) child.move(dx, dy);
  }
  public override scale(factor: number): void {
    this.validateScale(factor);
    for (const child of this.#children) child.scale(factor);
  }
  /** @internal Used only by SvgDocument after aggregate-wide validation. */
  public replaceChildren(children: readonly Shape[], authority: symbol): void {
    if (authority !== treeAuthority) throw new Error('tree mutation requires document authority');
    this.#children = [...children];
  }
}

// Not re-exported by a public entry point; domain-internal mutation capability.
export const treeAuthority: unique symbol = Symbol('document tree authority');
