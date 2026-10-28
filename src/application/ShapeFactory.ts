import { Shape } from '../domain/Shape.js';
import { Rect } from '../domain/Rect.js';
import { Circle } from '../domain/Circle.js';
import { Ellipse } from '../domain/Ellipse.js';
import { Line } from '../domain/Line.js';
import { Text } from '../domain/Text.js';
import { Group } from '../domain/Group.js';
import { CommandArguments } from './CommandArguments.js';

/** The only shape-name dispatch point; replace with providers in the plugin phase. */
export class ShapeFactory {
  public create(type: string, id: string, params: readonly string[], quotedParams?: readonly boolean[]): Shape {
    const a = new CommandArguments(params, `create ${type} <id> <geometry...> [style] [in <containerId>]`);
    let shape: Shape;
    let style: string | undefined;
    let styleAttribute = 'fill';
    switch (type) {
      case 'rect':
        a.count(4, 5); shape = new Rect(id, a.number(0), a.number(1), a.number(2), a.number(3)); style = params[4]; break;
      case 'circle':
        a.count(3, 4); shape = new Circle(id, a.number(0), a.number(1), a.number(2)); style = params[3]; break;
      case 'ellipse':
        a.count(4, 5); shape = new Ellipse(id, a.number(0), a.number(1), a.number(2), a.number(3)); style = params[4]; break;
      case 'line':
        a.count(4, 5); shape = new Line(id, a.number(0), a.number(1), a.number(2), a.number(3)); style = params[4]; styleAttribute = 'stroke'; break;
      case 'text':
        a.count(3);
        if (quotedParams && !quotedParams[2]) throw new Error('text content must be enclosed in double quotes');
        shape = new Text(id, a.number(0), a.number(1), a.at(2)); break;
      case 'g':
        a.count(0); shape = new Group(id); break;
      default: throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    }
    if (style !== undefined) shape.set(styleAttribute, style);
    return shape;
  }
}
