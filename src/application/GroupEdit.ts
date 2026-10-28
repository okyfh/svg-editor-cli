import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class GroupEdit extends EditCommand {
  public constructor(private readonly id: string, private readonly members: readonly string[]) { super(); }
  public override execute(document: SvgDocument): string {
    const group = document.group(this.id, this.members);
    return `g#${group.id} created with ${group.children.length} children`;
  }
}
