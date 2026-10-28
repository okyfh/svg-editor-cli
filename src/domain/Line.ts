import { GeometricShape } from './GeometricShape.js';

export class Line extends GeometricShape {
  public constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id, { x1, y1, x2, y2 }, []);
  }
  public override get type(): string { return 'line'; }
  protected override get xAttributes(): readonly string[] { return ["x1", "x2"]; }
  protected override get yAttributes(): readonly string[] { return ["y1", "y2"]; }
}
