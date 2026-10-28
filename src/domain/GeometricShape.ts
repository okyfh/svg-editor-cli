import { Memento } from './Memento.js';
import { Shape } from './Shape.js';
import { Geometry } from './Geometry.js';

export abstract class GeometricShape extends Shape {
  #geometry: Geometry;
  protected constructor(id: string, values: Readonly<Record<string, number>>, sizes: readonly string[]) {
    super(id);
    this.#geometry = new Geometry(values, sizes);
  }
  protected abstract get xAttributes(): readonly string[];
  protected abstract get yAttributes(): readonly string[];
  protected override get geometryAttributes(): Readonly<Record<string, number>> { return this.#geometry.attributes; }
  public override set(attribute: string, value: string): void {
    if (this.#geometry.has(attribute)) this.#geometry.set(attribute, value);
    else super.set(attribute, value);
  }
  public override capture(): Memento {
    const base = super.capture();
    const geometry = this.#geometry.copy();
    return new Memento(() => { base.restore(); this.#geometry = geometry.copy(); });
  }
  public override move(dx: number, dy: number): void {
    this.#geometry = this.#geometry.translated(this.xAttributes, this.yAttributes, dx, dy);
  }
  public override scale(factor: number): void { this.#geometry = this.#geometry.scaled(factor); }
  /** Preflight supports atomic transformations of an entire subtree. */
  public override validateMove(dx: number, dy: number): void {
    this.#geometry.translated(this.xAttributes, this.yAttributes, dx, dy);
  }
  public override validateScale(factor: number): void { this.#geometry.scaled(factor); }
}
