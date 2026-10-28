import { Shape } from '../domain/Shape.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { ShapeFormatter } from './ShapeFormatter.js';

export class TreeFormatter {
  public constructor(private readonly shapes = new ShapeFormatter()) {}
  public format(doc: SvgDocument, id?: string): string {
    const root = id === undefined ? undefined : doc.require(id);
    const lines = [root ? this.shapes.summary(root) : `svg (${doc.width}x${doc.height})`];
    this.append(root ? root.children : doc.children, '', lines);
    return lines.join('\n');
  }
  private append(children: readonly Shape[], prefix: string, lines: string[]): void {
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${this.shapes.summary(child)}`);
      this.append(child.children, `${prefix}${last ? '    ' : '│   '}`, lines);
    });
  }
}
