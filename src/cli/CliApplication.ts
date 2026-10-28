import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { CommandDispatcher } from './CommandDispatcher.js';

export class CliApplication {
  public constructor(private readonly dispatcher: CommandDispatcher) {}
  public run(): void {
    const terminal = createInterface({ input: stdin, output: stdout, terminal: Boolean(stdin.isTTY && stdout.isTTY) });
    terminal.setPrompt('svg> ');
    console.log("svg-editor 0.1 — type 'help' for commands");
    terminal.prompt();
    terminal.on('line', (line: string) => {
      const output = this.dispatcher.dispatch(line);
      if (output !== undefined) console.log(output);
      terminal.prompt();
    });
  }
}
