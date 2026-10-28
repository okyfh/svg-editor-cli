import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

/** Repository-specific checks for the static imports used in this project. */
export class ArchitectureCheck {
  readonly #rules: Readonly<Record<string, readonly string[]>> = {
    domain: ['domain'],
    application: ['application', 'domain'],
    cli: ['cli', 'application', 'domain'],
    infrastructure: ['infrastructure', 'application', 'domain'],
  };
  readonly #errors: string[] = [];
  readonly #graph = new Map<string, string[]>();
  public run(): void {
    const root = resolve('src');
    const files = this.files(root);
    for (const file of files) this.#graph.set(file, []);
    for (const file of files) this.inspect(root, file);
    const active = new Set<string>(), visited = new Set<string>();
    for (const file of files) this.visit(file, active, visited);
    if (this.#errors.length > 0) throw new Error(this.#errors.join('\n'));
    console.log(`Architecture OK: ${files.length} source files; module directions, imports, class names and cycles checked.`);
  }
  private files(directory: string): string[] {
    const result: string[] = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) result.push(...this.files(path));
      else if (entry.name.endsWith('.ts')) result.push(path);
    }
    return result;
  }
  private inspect(root: string, file: string): void {
    const source = readFileSync(file, 'utf8');
    const path = relative(root, file);
    const layer = path.split('/')[0]!;
    const declarations = [...source.matchAll(/^export\s+(?:abstract\s+)?(?:class|interface)\s+(\w+)/gm)];
    if (file !== join(root, 'main.ts') && (declarations.length !== 1 || declarations[0]?.[1] !== basename(file, '.ts'))) {
      this.#errors.push(`${path}: expected one exported class/interface matching the filename`);
    }
    if (/^(?:export\s+)?(?:async\s+)?function\s/m.test(source)) this.#errors.push(`${path}: top-level procedural function`);
    if (/\bswitch\s*\(/.test(source) && path !== 'application/ShapeFactory.ts' && path !== 'cli/CommandDispatcher.ts') {
      this.#errors.push(`${path}: review dispatch outside the two allowed locations`);
    }
    for (const match of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      const name = match[1]!;
      if (!name.startsWith('.')) {
        if (layer === 'domain' || layer === 'application') this.#errors.push(`${path}: external dependency ${name}`);
        continue;
      }
      const target = resolve(dirname(file), name).replace(/\.js$/, '.ts');
      if (!this.#graph.has(target)) { this.#errors.push(`${path}: unresolved import ${name}`); continue; }
      this.#graph.get(file)!.push(target);
      const targetLayer = relative(root, target).split('/')[0]!;
      const allowed = this.#rules[layer];
      if (allowed && !allowed.includes(targetLayer)) this.#errors.push(`${path}: forbidden dependency on ${targetLayer}`);
      if (target === join(root, 'main.ts')) this.#errors.push(`${path}: dependency on composition root`);
      if (source.includes('treeAuthority') && layer !== 'domain') this.#errors.push(`${path}: domain-internal tree capability`);
    }
  }
  private visit(file: string, active: Set<string>, visited: Set<string>): void {
    if (active.has(file)) { this.#errors.push(`circular dependency: ${relative(resolve('src'), file)}`); return; }
    if (visited.has(file)) return;
    active.add(file);
    for (const dependency of this.#graph.get(file) ?? []) this.visit(dependency, active, visited);
    active.delete(file); visited.add(file);
  }
}

new ArchitectureCheck().run();
