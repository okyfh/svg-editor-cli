export interface Command {
  readonly syntax: string;
  execute(args: readonly string[]): string;
}
