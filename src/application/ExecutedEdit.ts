import { Memento } from '../domain/Memento.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

/** Owns one command and its opaque before/after states. */
export class ExecutedEdit {
  #before: Memento | undefined;
  #after: Memento | undefined;
  #summary = '';
  public constructor(private readonly command: EditCommand) {}
  public execute(document: SvgDocument): string {
    if (this.#after) throw new Error('edit already executed');
    const before = document.capture();
    let summary: string;
    try { summary = this.command.execute(document); }
    catch (error) { before.restore(); throw error; }
    this.#before = before;
    this.#after = document.capture();
    this.#summary = summary;
    return summary;
  }
  public undo(): string {
    if (!this.#before) throw new Error('edit has not executed');
    this.#before.restore();
    return `undone: ${this.#summary}`;
  }
  public redo(): string {
    if (!this.#after) throw new Error('edit has not executed');
    // Restore the successful result, avoiding floating-point drift and re-validation.
    this.#after.restore();
    return `redone: ${this.#summary}`;
  }
}
