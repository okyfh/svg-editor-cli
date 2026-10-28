import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class AddToEdit extends EditCommand {
  public constructor(private readonly containerId: string, private readonly id: string) { super(); }
  public override execute(document: SvgDocument): string {
    document.addTo(this.containerId, this.id);
    const shape = document.require(this.id);
    return `${shape.type}#${shape.id} added to g#${this.containerId}`;
  }
}
