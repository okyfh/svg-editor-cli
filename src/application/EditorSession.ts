import { CommandHistory } from './CommandHistory.js';
import { EditCommand } from './EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';

export class EditorSession {
  readonly #history = new CommandHistory();
  #document: SvgDocument | undefined;
  public get document(): SvgDocument {
    if (!this.#document) throw new Error("no document. use 'init' or 'read' first");
    return this.#document;
  }
  public init(width = 800, height = 600): SvgDocument {
    const next = new SvgDocument(width, height);
    this.#document = next;
    this.#history.barrier();
    return next;
  }
  public edit(command: EditCommand): string { return this.#history.execute(command, this.document); }
  public undo(): string { void this.document; return this.#history.undo(); }
  public redo(): string { void this.document; return this.#history.redo(); }
  public resize(width: number, height: number): void {
    this.document.resize(width, height);
    this.#history.barrier();
  }
}
