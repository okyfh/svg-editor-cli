import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { MoveEdit } from './MoveEdit.js';

export class MoveCommand implements Command {
  public readonly syntax = 'move <id> <dx> <dy>';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(3, 3);
    return this.session.edit(new MoveEdit(a.at(0), a.number(1), a.number(2)));
  }
}
