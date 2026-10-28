import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class FrontEdit extends EditCommand {
  public constructor(private readonly id: string) { super(); }
  public override execute(document: SvgDocument): string {
    document.front(this.id);
    const shape = document.require(this.id);
    return `${shape.type}#${shape.id} moved to front`;
  }
}
