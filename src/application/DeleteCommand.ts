import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { DeleteEdit } from './DeleteEdit.js';

export class DeleteCommand implements Command {
  public readonly syntax = 'delete <id>';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(1, 1);
    return this.session.edit(new DeleteEdit(a.at(0)));
  }
}
