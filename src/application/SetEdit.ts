import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class SetEdit extends EditCommand {
  public constructor(private readonly id: string, private readonly attribute: string, private readonly value: string) { super(); }
  public override execute(document: SvgDocument): string {
    document.set(this.id, this.attribute, this.value);
    const shape = document.require(this.id);
    return `${shape.type}#${shape.id} updated: ${this.attribute}=${JSON.stringify(this.value)}`;
  }
}
