import type { Command } from '../application/Command.js';
import { CommandArguments } from '../application/CommandArguments.js';
import { EditorSession } from '../application/EditorSession.js';
import { ShapeFormatter } from './ShapeFormatter.js';

export class ShowCommand implements Command {
  public readonly syntax = 'show <id>';
  public constructor(private readonly session: EditorSession, private readonly formatter = new ShapeFormatter()) {}
  public execute(args: readonly string[]): string {
    const doc = this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(1);
    const shape = doc.require(a.at(0));
    const parent = doc.parentOf(shape.id);
    return this.formatter.details(shape, parent ? `g#${parent.id}` : 'svg');
  }
}
