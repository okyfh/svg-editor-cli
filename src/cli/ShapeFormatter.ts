import { Shape } from '../domain/Shape.js';

/** Formats attributes without dispatching on a shape's type name. */
export class ShapeFormatter {
  public summary(shape: Shape): string {
    const aliases: Readonly<Record<string, string>> = { width: 'w', height: 'h' };
    const fields = Object.entries(shape.attributes).map(([key, value]) =>
      key === 'text' ? JSON.stringify(value) : `${aliases[key] ?? key}=${value}`);
    return [`${shape.type}#${shape.id}`, ...fields].join('  ');
  }
  public details(shape: Shape, parent: string): string {
    const fields = Object.entries(shape.attributes).map(([key, value]) =>
      `  ${key}=${typeof value === 'string' ? JSON.stringify(value) : value}`);
    return [`${shape.type}#${shape.id}  parent=${parent}`, ...fields].join('\n');
  }
}
