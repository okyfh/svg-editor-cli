import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom';
import type { Document, Element } from '@xmldom/xmldom';
import { SvgDocument } from '../domain/SvgDocument.js';
import { Shape } from '../domain/Shape.js';

export class SvgWriter {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  public serialize(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = xml.documentElement!;
    root.setAttribute('width', String(document.width));
    root.setAttribute('height', String(document.height));
    root.setAttribute('viewBox', `0 0 ${document.width} ${document.height}`);
    for (const [name, value] of Object.entries(document.svgAttributes)) root.setAttribute(name, value);
    for (const child of document.children) root.appendChild(this.element(xml, child));
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(xml, { requireWellFormed: true })}\n`;
  }
  private element(xml: Document, shape: Shape): Element {
    const element = xml.createElementNS(this.namespace, shape.type);
    element.setAttribute('id', shape.id);
    for (const [name, value] of Object.entries(shape.attributes)) {
      if (name !== 'text') element.setAttribute(name, String(value));
    }
    if (shape.content !== undefined) element.appendChild(xml.createTextNode(shape.content));
    for (const child of shape.children) element.appendChild(this.element(xml, child));
    return element;
  }
}
