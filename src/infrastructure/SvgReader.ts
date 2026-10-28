import { SvgStyle } from './SvgStyle.js';
import { SvgTransform } from './SvgTransform.js';
import { DOMParser, onWarningStopParsing } from '@xmldom/xmldom';
import type { Element, Node } from '@xmldom/xmldom';
import { ShapeFactory } from '../application/ShapeFactory.js';
import { CommandArguments } from '../application/CommandArguments.js';
import { ReadResult } from '../application/ReadResult.js';
import { SvgDocument } from '../domain/SvgDocument.js';
import { Group } from '../domain/Group.js';

/** Reads the six-shape SVG subset without silently dropping unsupported semantics. */
export class SvgReader {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  public constructor(private readonly factory = new ShapeFactory()) {}
  public parse(source: string): ReadResult {
    try { return this.parseDocument(source); }
    catch (error) {
      throw new Error(`invalid SVG: ${error instanceof Error ? error.message : 'invalid XML'}`);
    }
  }
  private parseDocument(source: string): ReadResult {
    const xml = new DOMParser({ onError: onWarningStopParsing }).parseFromString(source, 'application/xml');
    if (xml.doctype) throw new Error('DOCTYPE is not supported');
    const root = xml.documentElement;
    if (!root || root.localName !== 'svg') throw new Error('expected <svg> root');
    this.validateNamespace(root);
    for (let node = xml.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 7 && node.nodeName !== 'xml') throw new Error('processing instructions are not supported');
    }
    const attributes = this.attributes(root);
    const rootPresentation = this.validateRoot(attributes);
    const rootExpanded = new SvgStyle().expand(attributes);
    let viewBox: number[] | undefined;
    if (attributes['viewBox'] !== undefined) {
      const parts = attributes['viewBox'].trim().split(/[\s,]+/);
      if (/^\s*,|,\s*,|,\s*$/.test(attributes['viewBox'])) throw new Error('invalid viewBox number list');
      if (parts.length !== 4) throw new Error('viewBox must contain four numbers');
      const a = new CommandArguments(parts, 'viewBox');
      viewBox = parts.map((_value, index) => a.number(index));
    }
    const width = this.length(rootExpanded['width'], viewBox?.[2] ?? 800);
    const height = this.length(rootExpanded['height'], viewBox?.[3] ?? 600);
    if (viewBox && (viewBox[2]! <= 0 || viewBox[3]! <= 0)) throw new Error('viewBox size must be positive');
    const rootValues = Object.fromEntries(Object.entries(attributes).filter(([key]) => !['width', 'height', 'transform'].includes(key)));
    const rootInlineStyle = new SvgStyle().declarations(attributes['style'] ?? '');
    if (rootInlineStyle['transform'] !== undefined) {
      const { transform: _rootTransform, ...rest } = rootInlineStyle;
      rootValues['style'] = Object.entries(rest).map(([key, value]) => `${key}:${value}`).join(';');
    }
    const document = new SvgDocument(width, height, rootValues);
    const rootTransform = SvgTransform.parse(rootExpanded['transform'], rootInlineStyle['transform'] !== undefined);
    const ids = new Set<string>();
    // Reserve every explicit id before assigning any missing one, including later elements.
    const reserve = (element: Element): void => {
      for (const child of this.elements(element)) {
        const id = child.getAttribute('id');
        if (id) {
          if (ids.has(id)) throw new Error(`id already exists: ${id}`);
          ids.add(id);
        }
        reserve(child);
      }
    };
    reserve(root);
    const counters = new Map<string, number>();
    const warnings: string[] = [];
    const load = (element: Element, parentTransform: SvgTransform, inherited: Readonly<Record<string, string>>, parentId?: string): void => {
      this.validateNamespace(element);
      const raw = this.attributes(element);
      const expandedStyle = new SvgStyle().expand(raw);
      const transform = parentTransform.compose(SvgTransform.parse(expandedStyle['transform'], new SvgStyle().declarations(raw['style'] ?? '')['transform'] !== undefined));
      const { transform: _transform, ...expanded } = expandedStyle;
      const values: Record<string, string> = { ...expanded };
      for (const [key, value] of Object.entries(values)) {
        if (value === 'inherit' && ['fill', 'stroke', 'stroke-width', 'font-size', 'text-anchor',
          'font-family', 'font-weight', 'font-style', 'opacity', 'fill-opacity', 'stroke-opacity',
          'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'visibility', 'display', 'color'].includes(key)) {
          if (inherited[key] !== undefined) values[key] = inherited[key];
          else delete values[key];
        }
      }
      const style = { ...inherited, ...values };
      const type = element.localName ?? element.tagName;
      let id = values['id'];
      if (!id) {
        let index = counters.get(type) ?? 0;
        do { id = `${type}${++index}`; } while (ids.has(id));
        counters.set(type, index); ids.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const children = this.elements(element);
      const shape = this.factory.fromSvg(type, id, values, element.textContent ?? '');
      if (!(shape instanceof Group) && children.length > 0) throw new Error(`child elements are not supported in <${type}>`);
      if (shape.content === undefined) this.validateContainerText(element);
      transform.normalize(shape, style);
      document.add(shape, parentId);
      for (const child of children) load(child, transform, style, shape.id);
    };
    this.validateContainerText(root);
    for (const child of this.elements(root)) load(child, rootTransform, rootPresentation);
    return new ReadResult(document, warnings);
  }
  private validateRoot(attributes: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
    const expanded = new SvgStyle().expand(attributes);
    const inline = new SvgStyle().declarations(attributes['style'] ?? '');
    if (inline['width'] !== undefined || inline['height'] !== undefined) {
      throw new Error('use SVG width/height attributes for canvas dimensions');
    }
    const rootOnly = ['width', 'height', 'viewBox', 'version', 'id', 'preserveAspectRatio', 'transform',
      'border', 'border-radius', 'background', 'background-color'];
    // Use the same presentation validation as every shape, not an unrelated root whitelist.
    const presentation: Record<string, string> = {};
    const probe = new Group('__root_validation__');
    for (const [key, value] of Object.entries(expanded)) {
      if (rootOnly.includes(key) || value === 'inherit') continue;
      if (['fill', 'stroke', 'stroke-width'].includes(key)) probe.set(key, key === 'stroke-width' ? value.replace(/px$/, '') : value);
      else probe.importPresentation(key, value);
      presentation[key] = value;
    }
    return presentation;
  }
  private attributes(element: Element): Readonly<Record<string, string>> {
    const entries: [string, string][] = [];
    for (let index = 0; index < element.attributes.length; index++) {
      const attribute = element.attributes.item(index)!;
      if (attribute.namespaceURI === 'http://www.w3.org/2000/xmlns/') continue;
      if (attribute.namespaceURI) throw new Error(`unsupported SVG attribute: ${attribute.name}`);
      entries.push([attribute.name, attribute.value]);
    }
    return Object.fromEntries(entries);
  }
  private elements(element: Element): Element[] {
    const children: Element[] = [];
    for (let node = element.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 1) children.push(node as Element);
      else if (![3, 4, 8].includes(node.nodeType)) throw new Error(`unsupported XML node: ${node.nodeName}`);
    }
    return children;
  }
  private validateContainerText(element: Element): void {
    for (let node: Node | null = element.firstChild; node; node = node.nextSibling) {
      if ((node.nodeType === 3 || node.nodeType === 4) && node.nodeValue?.trim()) {
        throw new Error(`unexpected text in <${element.localName}>`);
      }
    }
  }
  private validateNamespace(element: Element): void {
    if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error(`unsupported namespace: ${element.namespaceURI}`);
  }
  private length(value: string | undefined, fallback: number): number {
    return value === undefined ? fallback : new CommandArguments([value.replace(/px$/, '')], 'SVG dimension').number(0);
  }
}
