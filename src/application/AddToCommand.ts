import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { AddToEdit } from './AddToEdit.js';

export class AddToCommand implements Command {
  public readonly syntax = 'addto <gid> <id>';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(2, 2);
    return this.session.edit(new AddToEdit(a.at(0), a.at(1)));
  }
}
