import { accessSync, constants, lstatSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { DocumentStore } from '../application/DocumentStore.js';
import { ReadResult } from '../application/ReadResult.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { SvgReader } from './SvgReader.js';
import { SvgWriter } from './SvgWriter.js';

export class SvgFileStore implements DocumentStore {
  public constructor(private readonly reader = new SvgReader(), private readonly writer = new SvgWriter()) {}
  public read(path: string): ReadResult {
    let source: string;
    try { source = readFileSync(path, 'utf8'); }
    catch { throw new Error(`cannot read file: ${path}`); }
    return this.reader.parse(source);
  }
  public write(document: SvgDocument, path: string): void {
    let temporary: string | undefined;
    try {
      const xml = this.writer.serialize(document);
      const target = resolve(path);
      let mode: number | undefined;
      try {
        const existing = lstatSync(target);
        if (!existing.isFile()) throw new Error('target is not a regular file');
        accessSync(target, constants.W_OK);
        mode = existing.mode & 0o777;
      } catch (error) {
        if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
      }
      temporary = mkdtempSync(join(dirname(target), '.svg-editor-'));
      const output = join(temporary, 'document.svg');
      writeFileSync(output, xml, { encoding: 'utf8', flag: 'wx', mode: mode ?? 0o666, flush: true });
      renameSync(output, target);
    } catch { throw new Error(`cannot write file: ${path}`); }
    finally {
      // Cleanup must not turn a successful atomic replacement into a reported failure.
      if (temporary) {
        try { rmSync(temporary, { recursive: true, force: true }); } catch { /* best effort */ }
      }
    }
  }
}
