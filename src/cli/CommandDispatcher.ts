import type { Command } from '../application/Command.js';
import { EditorSession } from '../application/EditorSession.js';
import { ShapeFactory } from '../application/ShapeFactory.js';
import { InitCommand } from '../application/InitCommand.js';
import { CanvasCommand } from '../application/CanvasCommand.js';
import { CreateCommand } from '../application/CreateCommand.js';
import { TreeCommand } from './TreeCommand.js';
import { ShowCommand } from './ShowCommand.js';
import { HelpCommand } from './HelpCommand.js';
import { PendingCommand } from './PendingCommand.js';
import { Tokenizer } from './Tokenizer.js';
import { Token } from './Token.js';

/** The only command-name dispatch point; registration is a future refactoring point. */
export class CommandDispatcher {
  readonly #commands: Map<string, Command>;
  readonly #create: CreateCommand;
  public constructor(session = new EditorSession(), private readonly tokenizer = new Tokenizer()) {
    this.#create = new CreateCommand(session, new ShapeFactory());
    this.#commands = new Map<string, Command>([
      ['init', new InitCommand(session)], ['canvas', new CanvasCommand(session)],
      ['create', this.#create], ['tree', new TreeCommand(session)], ['show', new ShowCommand(session)],
    ]);
    for (const syntax of ['delete <id>', 'move <id> <dx> <dy>', 'scale <id> <factor>', 'set <id> <attr> <value>', 'group <newGid> <id1> <id2>...', 'ungroup <gid>', 'addto <gid> <id>', 'front <id>', 'back <id>', 'undo', 'redo']) {
      this.#commands.set(syntax.split(' ')[0]!, new PendingCommand(`${syntax} (stage 4)`, 4, session));
    }
    this.#commands.set('read', new PendingCommand('read <file.svg> (stage 5)', 5, session, false));
    this.#commands.set('save', new PendingCommand('save [file.svg] (stage 5)', 5, session));
    this.#commands.set('help', new HelpCommand(() => [...this.#commands.values()]));
  }
  public dispatch(line: string): string | undefined {
    try {
      const tokens = this.tokenizer.tokenize(line);
      const name = tokens[0]?.value;
      if (name === undefined) return undefined;
      const command = this.#commands.get(name);
      if (!command) throw new Error(`unknown command: ${name}`);
      const args = tokens.slice(1);
      if (command === this.#create) return this.create(args);
      return command.execute(args.map(token => token.value));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unexpected failure';
      return `error: ${message.replace(/[\r\n]+/g, ' ')}`;
    }
  }
  private create(tokens: readonly Token[]): string {
    const args = [...tokens];
    let container: string | undefined;
    const clause = args[args.length - 2];
    if (args.length >= 4 && clause?.value === 'in' && !clause.isQuoted) {
      container = args.pop()!.value; args.pop();
    }
    return this.#create.executeParsed(args.map(token => token.value), args.map(token => token.isQuoted), container);
  }
}
