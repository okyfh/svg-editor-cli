import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { BackEdit } from './BackEdit.js';

export class BackCommand implements Command {
  public readonly syntax = 'back <id>';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(1, 1);
    return this.session.edit(new BackEdit(a.at(0)));
  }
}
