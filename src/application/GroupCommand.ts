import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';
import { GroupEdit } from './GroupEdit.js';

export class GroupCommand implements Command {
  public readonly syntax = 'group <newGid> <id1> <id2>...';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    const a = new CommandArguments(args, this.syntax); a.count(3, Number.POSITIVE_INFINITY);
    return this.session.edit(new GroupEdit(a.at(0), args.slice(1)));
  }
}
