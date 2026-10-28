import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { ShapeFactory } from './ShapeFactory.js';

export class CreateCommand implements Command {
  public readonly syntax = 'create <type> <id> [params...] [in <containerId>]';
  public constructor(private readonly session: EditorSession, private readonly factory: ShapeFactory) {}
  public execute(args: readonly string[]): string { return this.executeParsed(args); }
  public executeParsed(args: readonly string[], quoted?: readonly boolean[], containerId?: string): string {
    const doc = this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(2, Number.POSITIVE_INFINITY);
    const shape = this.factory.create(a.at(0), a.at(1), args.slice(2), quoted?.slice(2));
    doc.add(shape, containerId);
    return `${shape.type}#${shape.id} created${containerId === undefined ? '' : ` in g#${containerId}`}`;
  }
}
