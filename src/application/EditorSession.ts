import type { DocumentStore } from './DocumentStore.js';
import { ReadResult } from './ReadResult.js';
import { CommandHistory } from './CommandHistory.js';
import { EditCommand } from './EditCommand.js';
import { SvgDocument } from '../domain/SvgDocument.js';

export class EditorSession {
  readonly #history = new CommandHistory();
  #document: SvgDocument | undefined;
  #filePath: string | undefined;
  public constructor(private readonly store?: DocumentStore) {}
  public get filePath(): string | undefined { return this.#filePath; }
  public get document(): SvgDocument {
    if (!this.#document) throw new Error("no document. use 'init' or 'read' first");
    return this.#document;
  }
  public init(width = 800, height = 600): SvgDocument {
    const next = new SvgDocument(width, height);
    this.#document = next;
    this.#filePath = undefined;
    this.#history.barrier();
    return next;
  }
  public read(path: string): ReadResult {
    const result = this.documentStore.read(path);
    this.#document = result.document;
    this.#filePath = path;
    this.#history.barrier();
    return result;
  }
  public save(path?: string): string {
    const document = this.document;
    const destination = path ?? this.#filePath;
    if (!destination?.trim()) throw new Error("no file path. use 'save <file.svg>' first");
    this.documentStore.write(document, destination);
    // Preserve the read path as the implicit save target; first explicit save of
    // a new document establishes a target until the next read/init.
    this.#filePath ??= destination;
    this.#history.barrier();
    return destination;
  }
  private get documentStore(): DocumentStore {
    if (!this.store) throw new Error('document store is not configured');
    return this.store;
  }
  public edit(command: EditCommand): string { return this.#history.execute(command, this.document); }
  public undo(): string { void this.document; return this.#history.undo(); }
  public redo(): string { void this.document; return this.#history.redo(); }
  public resize(width: number, height: number): void {
    this.document.resize(width, height);
    this.#history.barrier();
  }
}
