import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';

export class UndoCommand implements Command {
  public readonly syntax = 'undo';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    new CommandArguments(args, this.syntax).count(0);
    return this.session.undo();
  }
}
