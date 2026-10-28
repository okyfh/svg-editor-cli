import { Token } from './Token.js';

export class Tokenizer {
  public tokenize(line: string): readonly Token[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const tokens: Token[] = [];
    let index = 0;
    while (index < line.length) {
      if (/\s/.test(line[index]!)) { index++; continue; }
      const quoted = line[index] === '"';
      let value = '';
      if (quoted) {
        index++;
        let closed = false;
        while (index < line.length) {
          const char = line[index++]!;
          if (char === '"') { closed = true; break; }
          if (char === '\\' && (line[index] === '"' || line[index] === '\\')) value += line[index++]!;
          else value += char;
        }
        if (!closed) throw new Error('unterminated double quote');
        if (index < line.length && !/\s/.test(line[index]!)) throw new Error('expected whitespace after quoted argument');
      } else {
        while (index < line.length && !/\s/.test(line[index]!)) {
          if (line[index] === '"') throw new Error('quoted argument must start after whitespace');
          value += line[index++]!;
        }
      }
      tokens.push(new Token(value, quoted));
    }
    return tokens;
  }
}
