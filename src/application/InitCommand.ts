import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';

export class InitCommand implements Command {
  public readonly syntax = 'init [w] [h]';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    const a = new CommandArguments(args, this.syntax); a.count(0, 2);
    const doc = this.session.init(args[0] === undefined ? 800 : a.number(0), args[1] === undefined ? 600 : a.number(1));
    return `canvas ${doc.width}x${doc.height} created`;
  }
}
