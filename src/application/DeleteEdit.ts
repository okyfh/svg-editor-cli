import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class DeleteEdit extends EditCommand {
  public constructor(private readonly id: string) { super(); }
  public override execute(document: SvgDocument): string {
    const shape = document.require(this.id);
    const label = `${shape.type}#${shape.id}`;
    document.delete(this.id);
    return `${label} deleted`;
  }
}
