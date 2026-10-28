import { Shape } from '../domain/Shape.js';
import { Rect } from '../domain/Rect.js';
import { Circle } from '../domain/Circle.js';
import { Ellipse } from '../domain/Ellipse.js';
import { Line } from '../domain/Line.js';
import { Text } from '../domain/Text.js';
import { Group } from '../domain/Group.js';
import { ShapeInput } from './ShapeInput.js';

/** The only shape-name dispatch point; CLI and SVG imports share it. */
export class ShapeFactory {
  public create(type: string, id: string, params: readonly string[], quotedParams?: readonly boolean[]): Shape {
    return this.build(type, id, ShapeInput.cli(type, params, quotedParams));
  }
  public fromSvg(type: string, id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    return this.build(type, id, ShapeInput.svg(type, attributes, text));
  }
  private build(type: string, id: string, input: ShapeInput): Shape {
    switch (type) {
      case 'rect':
        input.count(4, 5);
        return input.finish(new Rect(id, input.number(0, 'x'), input.number(1, 'y'), input.number(2, 'width'), input.number(3, 'height')), 4);
      case 'circle':
        input.count(3, 4);
        return input.finish(new Circle(id, input.number(0, 'cx'), input.number(1, 'cy'), input.number(2, 'r')), 3);
      case 'ellipse':
        input.count(4, 5);
        return input.finish(new Ellipse(id, input.number(0, 'cx'), input.number(1, 'cy'), input.number(2, 'rx'), input.number(3, 'ry')), 4);
      case 'line':
        input.count(4, 5);
        return input.finish(new Line(id, input.number(0, 'x1'), input.number(1, 'y1'), input.number(2, 'x2'), input.number(3, 'y2')), 4, 'stroke');
      case 'text':
        input.count(3);
        return input.finish(new Text(id, input.number(0, 'x'), input.number(1, 'y'), input.content()));
      case 'g':
        input.count(0);
        return input.finish(new Group(id));
      default: throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
  }
}
