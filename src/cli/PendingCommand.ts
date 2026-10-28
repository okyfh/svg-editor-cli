import type { Command } from '../application/Command.js';
import { EditorSession } from '../application/EditorSession.js';

export class PendingCommand implements Command {
  public constructor(public readonly syntax: string, private readonly stage: number, private readonly session: EditorSession, private readonly needsDocument = true) {}
  public execute(_args: readonly string[]): string {
    if (this.needsDocument) void this.session.document;
    throw new Error(`command is planned for stage ${this.stage}`);
  }
}
