import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';

export class CanvasCommand implements Command {
  public readonly syntax = 'canvas [w] [h]';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    const doc = this.session.document;
    const a = new CommandArguments(args, this.syntax);
    if (args.length === 0) return `canvas ${doc.width}x${doc.height}`;
    a.count(2);
    this.session.resize(a.number(0), a.number(1));
    return `canvas resized to ${doc.width}x${doc.height}`;
  }
}
