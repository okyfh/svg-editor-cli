import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class MoveEdit extends EditCommand {
  public constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) { super(); }
  public override execute(document: SvgDocument): string {
    document.move(this.id, this.dx, this.dy);
    const shape = document.require(this.id);
    return `${shape.type}#${shape.id} moved by (${this.dx},${this.dy})`;
  }
}
