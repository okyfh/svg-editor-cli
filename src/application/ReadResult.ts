import { SvgDocument } from '../domain/SvgDocument.js';

export class ReadResult {
  readonly #warnings: readonly string[];
  public constructor(private readonly value: SvgDocument, warnings: readonly string[]) {
    this.#warnings = Object.freeze([...warnings]);
  }
  public get document(): SvgDocument { return this.value; }
  public get warnings(): readonly string[] { return this.#warnings; }
}
