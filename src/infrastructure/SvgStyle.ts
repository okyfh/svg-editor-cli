/** Parses inline declarations, preserving quoted strings and parenthesized values. */
export class SvgStyle {
  public declarations(source: string): Readonly<Record<string, string>> {
    const result: Record<string, string> = {};
    let current = '', quote = '', depth = 0;
    const declarations: string[] = [];
    for (let index = 0; index < source.length; index++) {
      const char = source[index]!;
      if (quote) {
        current += char;
        if (char === '\\' && index + 1 < source.length) current += source[++index]!;
        else if (char === quote) quote = '';
      } else if (char === '/' && source[index + 1] === '*') {
        const end = source.indexOf('*/', index + 2);
        if (end < 0) throw new Error('unterminated style comment');
        index = end + 1; current += ' ';
      } else if (char === '"' || char === "'") { quote = char; current += char; }
      else if (char === '(') { depth++; current += char; }
      else if (char === ')') { depth--; current += char; }
      else if (char === ';' && depth === 0) { declarations.push(current); current = ''; }
      else current += char;
      if (depth < 0) throw new Error('invalid inline style');
    }
    if (quote || depth !== 0) throw new Error('invalid inline style');
    declarations.push(current);
    const important = new Set<string>();
    for (const declaration of declarations) {
      if (!declaration.trim()) continue;
      const colon = declaration.indexOf(':');
      if (colon < 1) throw new Error('invalid inline style');
      const name = declaration.slice(0, colon).trim().toLowerCase();
      const raw = declaration.slice(colon + 1).trim();
      const priority = /!important\s*$/i.test(raw);
      const value = raw.replace(/!important\s*$/i, '').trim();
      if (!/^[a-z][a-z-]*$/.test(name) || !value) throw new Error('invalid inline style');
      if (!important.has(name) || priority) result[name] = value;
      if (priority) important.add(name);
    }
    return Object.freeze(result);
  }
  public expand(attributes: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
    const { style, ...rest } = attributes;
    return style === undefined ? rest : { ...rest, ...this.declarations(style) };
  }
}
