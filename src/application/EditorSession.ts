import { SvgDocument } from '../domain/SvgDocument.js';

export class EditorSession {
  #document: SvgDocument | undefined;
  public get document(): SvgDocument {
    if (!this.#document) throw new Error("no document. use 'init' or 'read' first");
    return this.#document;
  }
  public init(width = 800, height = 600): SvgDocument {
    const next = new SvgDocument(width, height);
    this.#document = next;
    return next;
  }
}
