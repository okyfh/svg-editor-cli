/** Retains quoting so a literal "in" never becomes a container clause. */
export class Token {
  public constructor(private readonly text: string, private readonly quoted: boolean) {}
  public get value(): string { return this.text; }
  public get isQuoted(): boolean { return this.quoted; }
}
