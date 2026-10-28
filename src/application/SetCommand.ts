import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { SetEdit } from './SetEdit.js';

export class SetCommand implements Command {
  public readonly syntax = 'set <id> <attr> <value>';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(3, 3);
    return this.session.edit(new SetEdit(a.at(0), a.at(1), a.at(2)));
  }
}
