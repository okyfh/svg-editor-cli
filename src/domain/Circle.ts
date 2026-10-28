import { GeometricShape } from './GeometricShape.js';

export class Circle extends GeometricShape {
  public constructor(id: string, cx: number, cy: number, r: number) {
    super(id, { cx, cy, r }, ["r"]);
  }
  public override get type(): string { return 'circle'; }
  protected override get xAttributes(): readonly string[] { return ["cx"]; }
  protected override get yAttributes(): readonly string[] { return ["cy"]; }
}
