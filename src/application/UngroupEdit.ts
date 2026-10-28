import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class UngroupEdit extends EditCommand {
  public constructor(private readonly id: string) { super(); }
  public override execute(document: SvgDocument): string {
    document.ungroup(this.id);
    return `g#${this.id} ungrouped`;
  }
}
