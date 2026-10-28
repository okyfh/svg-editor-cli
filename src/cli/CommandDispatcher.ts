import { DeleteCommand } from '../application/DeleteCommand.js';
import { MoveCommand } from '../application/MoveCommand.js';
import { ScaleCommand } from '../application/ScaleCommand.js';
import { SetCommand } from '../application/SetCommand.js';
import { GroupCommand } from '../application/GroupCommand.js';
import { UngroupCommand } from '../application/UngroupCommand.js';
import { AddToCommand } from '../application/AddToCommand.js';
import { FrontCommand } from '../application/FrontCommand.js';
import { BackCommand } from '../application/BackCommand.js';
import { UndoCommand } from '../application/UndoCommand.js';
import { RedoCommand } from '../application/RedoCommand.js';
import type { Command } from '../application/Command.js';
import { EditorSession } from '../application/EditorSession.js';
import { ShapeFactory } from '../application/ShapeFactory.js';
import { InitCommand } from '../application/InitCommand.js';
import { CanvasCommand } from '../application/CanvasCommand.js';
import { CreateCommand } from '../application/CreateCommand.js';
import { TreeCommand } from './TreeCommand.js';
import { ShowCommand } from './ShowCommand.js';
import { HelpCommand } from './HelpCommand.js';
import { ReadCommand } from '../application/ReadCommand.js';
import { SaveCommand } from '../application/SaveCommand.js';
import { Tokenizer } from './Tokenizer.js';
import { Token } from './Token.js';

/** The only command-name dispatch point; registration is a future refactoring point. */
export class CommandDispatcher {
  readonly #commands: Map<string, Command>;
  readonly #create: CreateCommand;
  public constructor(session: EditorSession, private readonly tokenizer = new Tokenizer()) {
    this.#create = new CreateCommand(session, new ShapeFactory());
    this.#commands = new Map<string, Command>([
      ['init', new InitCommand(session)], ['canvas', new CanvasCommand(session)],
      ['create', this.#create], ['tree', new TreeCommand(session)], ['show', new ShowCommand(session)],
    ]);
    this.#commands.set('delete', new DeleteCommand(session));
    this.#commands.set('move', new MoveCommand(session));
    this.#commands.set('scale', new ScaleCommand(session));
    this.#commands.set('set', new SetCommand(session));
    this.#commands.set('group', new GroupCommand(session));
    this.#commands.set('ungroup', new UngroupCommand(session));
    this.#commands.set('addto', new AddToCommand(session));
    this.#commands.set('front', new FrontCommand(session));
    this.#commands.set('back', new BackCommand(session));
    this.#commands.set('undo', new UndoCommand(session));
    this.#commands.set('redo', new RedoCommand(session));
    this.#commands.set('read', new ReadCommand(session));
    this.#commands.set('save', new SaveCommand(session));
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
