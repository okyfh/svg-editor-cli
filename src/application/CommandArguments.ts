export class CommandArguments {
  public constructor(private readonly args: readonly string[], private readonly syntax: string) {}
  public count(min: number, max = min): void {
    if (this.args.length < min || this.args.length > max) throw new Error(`usage: ${this.syntax}`);
  }
  public at(index: number): string {
    const value = this.args[index];
    if (value === undefined) throw new Error(`usage: ${this.syntax}`);
    return value;
  }
  public number(index: number): number {
    const value = this.at(index);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) || !Number.isFinite(Number(value))) {
      throw new Error(`invalid number: ${value}`);
    }
    return Number(value);
  }
}
