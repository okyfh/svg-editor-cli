import type { Command } from '../application/Command.js';
import { CommandArguments } from '../application/CommandArguments.js';
import { EditorSession } from '../application/EditorSession.js';
import { TreeFormatter } from './TreeFormatter.js';

export class TreeCommand implements Command {
  public readonly syntax = 'tree [id]';
  public constructor(private readonly session: EditorSession, private readonly formatter = new TreeFormatter()) {}
  public execute(args: readonly string[]): string {
    const doc = this.session.document;
    new CommandArguments(args, this.syntax).count(0, 1);
    return this.formatter.format(doc, args[0]);
  }
}
