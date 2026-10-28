import { GeometricShape } from './GeometricShape.js';

export class Ellipse extends GeometricShape {
  public constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, { cx, cy, rx, ry }, ["rx", "ry"]);
  }
  public override get type(): string { return 'ellipse'; }
  protected override get xAttributes(): readonly string[] { return ["cx"]; }
  protected override get yAttributes(): readonly string[] { return ["cy"]; }
}
