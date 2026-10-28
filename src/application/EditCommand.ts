import { SvgDocument } from '../domain/SvgDocument.js';

/** One instance represents one successful edit in history. */
export abstract class EditCommand {
  public abstract execute(document: SvgDocument): string;
}
