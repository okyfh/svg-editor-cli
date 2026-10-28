import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';
import { ExecutedEdit } from './ExecutedEdit.js';

export class CommandHistory {
  readonly #undo: ExecutedEdit[] = [];
  readonly #redo: ExecutedEdit[] = [];
  #blocked = true;
  public barrier(): void { this.#undo.length = 0; this.#redo.length = 0; this.#blocked = true; }
  public execute(command: EditCommand, document: SvgDocument): string {
    const entry = new ExecutedEdit(command);
    const summary = entry.execute(document);
    this.#undo.push(entry);
    this.#redo.length = 0;
    this.#blocked = false;
    return summary;
  }
  public undo(): string {
    this.assertAllowed();
    const entry = this.#undo.at(-1);
    if (!entry) throw new Error('nothing to undo');
    const result = entry.undo();
    this.#undo.pop(); this.#redo.push(entry);
    return result;
  }
  public redo(): string {
    this.assertAllowed();
    const entry = this.#redo.at(-1);
    if (!entry) throw new Error('nothing to redo');
    const result = entry.redo();
    this.#redo.pop(); this.#undo.push(entry);
    return result;
  }
  private assertAllowed(): void {
    if (this.#blocked) throw new Error('undo not allowed after io command');
  }
}
