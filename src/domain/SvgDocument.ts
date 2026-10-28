import { Shape } from './Shape.js';
import { Group, treeAuthority } from './Group.js';

/** Aggregate root: all structural changes validate the complete document first. */
export class SvgDocument {
  static readonly #owners = new WeakMap<Shape, SvgDocument>();
  #width: number;
  #height: number;
  #children: Shape[] = [];
  public constructor(width = 800, height = 600) {
    this.validateSize(width, height);
    this.#width = width; this.#height = height;
  }
  public get width(): number { return this.#width; }
  public get height(): number { return this.#height; }
  public get children(): readonly Shape[] { return Object.freeze([...this.#children]); }
  public resize(width: number, height: number): void {
    this.validateSize(width, height);
    this.#width = width; this.#height = height;
  }
  public find(id: string): Shape | undefined {
    for (const child of this.#children) {
      const found = child.find(id);
      if (found) return found;
    }
    return undefined;
  }
  public require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  public parentOf(id: string): Group | undefined {
    this.require(id);
    return this.locate(id).parent;
  }
  public add(shape: Shape, containerId?: string): void {
    const parent = containerId === undefined ? undefined : this.container(containerId);
    const ids = new Set<string>();
    const visit = (node: Shape): void => {
      if (SvgDocument.#owners.has(node)) throw new Error(`shape already belongs to a document: ${node.id}`);
      if (ids.has(node.id) || this.find(node.id)) throw new Error(`id already exists: ${node.id}`);
      ids.add(node.id);
      for (const child of node.children) visit(child);
    };
    visit(shape);
    this.replace(parent, [...this.siblings(parent), shape]);
    this.claim(shape);
  }
  public delete(id: string): Shape {
    const shape = this.require(id);
    const { parent } = this.locate(id);
    this.replace(parent, this.siblings(parent).filter(child => child !== shape));
    this.release(shape);
    return shape;
  }
  public move(id: string, dx: number, dy: number): void { this.require(id).move(dx, dy); }
  public scale(id: string, factor: number): void { this.require(id).scale(factor); }
  public set(id: string, attribute: string, value: string): void { this.require(id).set(attribute, value); }
  public addTo(containerId: string, id: string): void {
    const parent = this.container(containerId);
    const shape = this.require(id);
    if (shape.find(parent.id)) throw new Error(`cannot move a container into its own descendant: ${id}`);
    this.delete(id);
    this.replace(parent, [...parent.children, shape]);
    this.claim(shape);
  }
  public group(id: string, memberIds: readonly string[]): Group {
    const group = new Group(id);
    if (this.find(id)) throw new Error(`id already exists: ${id}`);
    if (memberIds.length === 0) throw new Error('group requires at least one shape');
    if (new Set(memberIds).size !== memberIds.length) throw new Error('duplicate group member');
    const selected = memberIds.map(memberId => this.require(memberId));
    for (const node of selected) {
      if (selected.some(other => node !== other && node.find(other.id))) {
        throw new Error(`cannot group a container into its own descendant: ${node.id}`);
      }
    }
    const ordered: Shape[] = [];
    const visit = (nodes: readonly Shape[]): void => {
      for (const node of nodes) {
        if (selected.includes(node)) ordered.push(node);
        else visit(node.children);
      }
    };
    visit(this.#children);
    const first = ordered[0]!;
    const parent = this.locate(first.id).parent;
    const index = this.siblings(parent).indexOf(first);
    for (const node of ordered) this.delete(node.id);
    group.replaceChildren(ordered, treeAuthority);
    const siblings = [...this.siblings(parent)];
    siblings.splice(index, 0, group);
    this.replace(parent, siblings);
    this.claim(group);
    return group;
  }
  public ungroup(id: string): void {
    const group = this.container(id);
    const parent = this.locate(id).parent;
    if (!parent) throw new Error(`cannot ungroup top-level container: ${id}`);
    const siblings = [...parent.children];
    siblings.splice(siblings.indexOf(group), 1, ...group.children);
    SvgDocument.#owners.delete(group);
    group.replaceChildren([], treeAuthority);
    this.replace(parent, siblings);
  }
  public front(id: string): void { this.reorder(id, true); }
  public back(id: string): void { this.reorder(id, false); }
  private reorder(id: string, front: boolean): void {
    const shape = this.require(id);
    const parent = this.locate(id).parent;
    const siblings = this.siblings(parent).filter(child => child !== shape);
    if (front) siblings.push(shape); else siblings.unshift(shape);
    this.replace(parent, siblings);
  }
  private container(id: string): Group {
    const shape = this.find(id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  private locate(id: string, parent?: Group): { parent: Group | undefined } {
    for (const shape of this.siblings(parent)) {
      if (shape.id === id) return { parent };
      if (shape instanceof Group && shape.find(id)) return this.locate(id, shape);
    }
    throw new Error(`no such shape: ${id}`);
  }
  private siblings(parent?: Group): readonly Shape[] { return parent ? parent.children : this.#children; }
  private replace(parent: Group | undefined, children: readonly Shape[]): void {
    if (parent) parent.replaceChildren(children, treeAuthority);
    else this.#children = [...children];
  }
  private claim(shape: Shape): void {
    SvgDocument.#owners.set(shape, this);
    for (const child of shape.children) this.claim(child);
  }
  private release(shape: Shape): void {
    SvgDocument.#owners.delete(shape);
    for (const child of shape.children) this.release(child);
  }
  private validateSize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error('canvas size must be positive and finite');
    }
  }
}
