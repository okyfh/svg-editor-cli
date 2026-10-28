/** Opaque, reusable snapshot; only the originating object knows its state. */
export class Memento {
  public constructor(private readonly restoreState: () => void) {}
  public restore(): void { this.restoreState(); }
}
