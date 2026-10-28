import type { Command } from '../application/Command.js';
import { CommandArguments } from '../application/CommandArguments.js';

export class HelpCommand implements Command {
  public readonly syntax = 'help';
  public constructor(private readonly commands: () => readonly Command[]) {}
  public execute(args: readonly string[]): string {
    new CommandArguments(args, this.syntax).count(0);
    return [
      ...this.commands().map(command => command.syntax),
      'create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]',
      'create circle <id> <cx> <cy> <r> [fill] [in <containerId>]',
      'create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]',
      'create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]',
      'create text <id> <x> <y> "content" [in <containerId>]',
      'create g <id> [in <containerId>]',
      '# starts a comment line; use double quotes for arguments with spaces',
    ].join('\n');
  }
}
