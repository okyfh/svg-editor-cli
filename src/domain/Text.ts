import { GeometricShape } from './GeometricShape.js';

export class Text extends GeometricShape {
  #content: string;
  public constructor(id: string, x: number, y: number, content: string) {
    super(id, { x, y }, []);
    this.#content = content;
  }
  public override get type(): string { return 'text'; }
  protected override get xAttributes(): readonly string[] { return ["x"]; }
  protected override get yAttributes(): readonly string[] { return ["y"]; }
  public get content(): string { return this.#content; }
  public override get attributes(): Readonly<Record<string, string | number>> {
    return Object.freeze({ ...super.attributes, text: this.#content });
  }
  public override set(attribute: string, value: string): void {
    if (attribute === 'text') this.#content = value;
    else super.set(attribute, value);
  }
}
