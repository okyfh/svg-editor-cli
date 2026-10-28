/** Encapsulates validated geometry; transformations validate all results before commit. */
export class Geometry {
  readonly #values: Map<string, number>;
  readonly #sizes: ReadonlySet<string>;

  public constructor(values: Readonly<Record<string, number>>, sizes: readonly string[]) {
    this.#sizes = new Set(sizes);
    this.#values = new Map(Object.entries(values));
    for (const [key, value] of this.#values) this.validate(key, value);
  }
  public get attributes(): Readonly<Record<string, number>> {
    return Object.freeze(Object.fromEntries(this.#values));
  }
  public copy(): Geometry { return new Geometry(this.attributes, [...this.#sizes]); }
  public has(key: string): boolean { return this.#values.has(key); }
  public set(key: string, value: string): void {
    const numeric = Number(value);
    if (!value.trim()) throw new Error('value must be a finite number');
    this.validate(key, numeric);
    this.#values.set(key, numeric);
  }
  public translated(xKeys: readonly string[], yKeys: readonly string[], dx: number, dy: number): Geometry {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error('value must be a finite number');
    const values = { ...this.attributes };
    for (const key of xKeys) values[key] = this.value(key) + dx;
    for (const key of yKeys) values[key] = this.value(key) + dy;
    return new Geometry(values, [...this.#sizes]);
  }
  public scaled(factor: number): Geometry {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('scale factor must be positive');
    return new Geometry(Object.fromEntries([...this.#values].map(([k, v]) => [k, v * factor])), [...this.#sizes]);
  }
  private value(key: string): number {
    const value = this.#values.get(key);
    if (value === undefined) throw new Error(`unknown attribute: ${key}`);
    return value;
  }
  private validate(key: string, value: number): void {
    if (!this.#values.has(key)) throw new Error(`unknown attribute: ${key}`);
    if (!Number.isFinite(value)) throw new Error('value must be a finite number');
    if (this.#sizes.has(key) && value < 0) throw new Error('size must be non-negative');
  }
}
