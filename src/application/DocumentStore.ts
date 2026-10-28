import { SvgDocument } from '../domain/SvgDocument.js';
import { ReadResult } from './ReadResult.js';

export interface DocumentStore {
  read(path: string): ReadResult;
  write(document: SvgDocument, path: string): void;
}
