import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

/** Stage 1 entry point; document commands are introduced in later stages. */
export class CliApplication {
  public run(): void {
    const terminal = createInterface({
      input: stdin,
      output: stdout,
      terminal: Boolean(stdin.isTTY && stdout.isTTY),
    });

    terminal.setPrompt('svg> ');
    console.log('svg-editor 0.1 — stage 1 scaffold; editing commands pending');
    terminal.prompt();

    terminal.on('line', (line: string) => {
      const input = line.trim();
      if (input.length > 0 && !input.startsWith('#')) {
        console.log('error: editing commands are not implemented in stage 1');
      }
      terminal.prompt();
    });
  }
}
