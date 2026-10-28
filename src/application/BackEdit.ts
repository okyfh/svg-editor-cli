import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class BackEdit extends EditCommand {
  public constructor(private readonly id: string) { super(); }
  public override execute(document: SvgDocument): string {
    document.back(this.id);
    const shape = document.require(this.id);
    return `${shape.type}#${shape.id} moved to back`;
  }
}
