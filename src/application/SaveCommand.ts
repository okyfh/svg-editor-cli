import type { Command } from './Command.js';
import { CommandArguments } from './CommandArguments.js';
import { EditorSession } from './EditorSession.js';

export class SaveCommand implements Command {
  public readonly syntax = 'save [file.svg]';
  public constructor(private readonly session: EditorSession) {}
  public execute(args: readonly string[]): string {
    void this.session.document;
    new CommandArguments(args, this.syntax).count(0, 1);
    if (args[0] !== undefined && !args[0].trim()) throw new Error(`usage: ${this.syntax}`);
    const path = this.session.save(args[0]);
    return `saved to ${path} (${this.session.document.elementCount} elements)`;
  }
}
