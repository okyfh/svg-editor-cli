import { SvgDocument } from '../domain/SvgDocument.js';
import { EditCommand } from './EditCommand.js';

export class ScaleEdit extends EditCommand {
  public constructor(private readonly id: string, private readonly factor: number) { super(); }
  public override execute(document: SvgDocument): string {
    document.scale(this.id, this.factor);
    const shape = document.require(this.id);
    return `${shape.type}#${shape.id} scaled by ${this.factor}`;
  }
}
