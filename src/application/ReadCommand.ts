import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';

export class ReadCommand implements Command {
  public readonly syntax = 'read <file.svg>';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    const a = new CommandArguments(args, this.syntax); a.count(1);
    const path = a.at(0);
    if (!path.trim()) throw new Error(`usage: ${this.syntax}`);
    const result = this.session.read(path);
    return [...result.warnings, `read ${path} (${result.document.elementCount} elements)`].join('\n');
  }
}
