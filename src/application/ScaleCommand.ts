import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { ScaleEdit } from './ScaleEdit.js';

export class ScaleCommand implements Command {
  public readonly syntax = 'scale <id> <factor>';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(2, 2);
    return this.session.edit(new ScaleEdit(a.at(0), a.number(1)));
  }
}
