import { GeometricShape } from './GeometricShape.js';

export class Rect extends GeometricShape {
  public constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height }, ["width", "height"]);
  }
  public override get type(): string { return 'rect'; }
  protected override get xAttributes(): readonly string[] { return ["x"]; }
  protected override get yAttributes(): readonly string[] { return ["y"]; }
}
