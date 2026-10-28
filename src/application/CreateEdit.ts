import { SvgDocument } from '../domain/SvgDocument.js';
import { Shape } from '../domain/Shape.js';
import { EditCommand } from './EditCommand.js';

export class CreateEdit extends EditCommand {
  public constructor(private readonly shape: Shape, private readonly containerId?: string) { super(); }
  public override execute(document: SvgDocument): string {
    document.add(this.shape, this.containerId);
    return `${this.shape.type}#${this.shape.id} created${this.containerId === undefined ? '' : ` in g#${this.containerId}`}`;
  }
}
