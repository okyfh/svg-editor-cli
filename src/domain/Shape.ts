import { Memento } from './Memento.js';

export abstract class Shape {
  readonly #id: string;
  readonly #style = new Map<string, string>();

  protected constructor(id: string) {
    if (!id || /\s/.test(id)) throw new Error('id must be non-empty and contain no whitespace');
    this.#id = id;
  }

  public get id(): string { return this.#id; }
  public abstract get type(): string;
  public get children(): readonly Shape[] { return []; }
  public get attributes(): Readonly<Record<string, string | number>> {
    return Object.freeze({ ...this.geometryAttributes, ...Object.fromEntries(this.#style) });
  }
  protected abstract get geometryAttributes(): Readonly<Record<string, string | number>>;
  public abstract move(dx: number, dy: number): void;
  public abstract scale(factor: number): void;
  public abstract validateMove(dx: number, dy: number): void;
  public abstract validateScale(factor: number): void;

  public set(attribute: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      throw new Error(`unknown attribute: ${attribute}`);
    }
    if (attribute === 'stroke-width') this.nonNegative(this.number(value));
    this.#style.set(attribute, value);
  }

  public capture(): Memento {
    const style = new Map(this.#style);
    return new Memento(() => {
      this.#style.clear();
      for (const [key, value] of style) this.#style.set(key, value);
    });
  }

  public find(id: string): Shape | undefined {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.find(id);
      if (found) return found;
    }
    return undefined;
  }

  protected number(value: string | number): number {
    const result = typeof value === 'number' ? value : Number(value);
    if ((typeof value === 'string' && !value.trim()) || !Number.isFinite(result)) {
      throw new Error('value must be a finite number');
    }
    return result;
  }
  protected nonNegative(value: number): number {
    if (value < 0) throw new Error('size must be non-negative');
    return value;
  }
  protected positiveFactor(value: number): number {
    if (!Number.isFinite(value) || value <= 0) throw new Error('scale factor must be positive');
    return value;
  }
}
