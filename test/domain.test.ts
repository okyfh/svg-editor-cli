import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SvgDocument } from '../src/domain/SvgDocument.js';
import { Rect } from '../src/domain/Rect.js';
import { Circle } from '../src/domain/Circle.js';
import { Ellipse } from '../src/domain/Ellipse.js';
import { Line } from '../src/domain/Line.js';
import { Text } from '../src/domain/Text.js';
import { Group } from '../src/domain/Group.js';

// Scenarios exercise public aggregate behavior rather than private implementation details.
test('nested flowchart moves and scales all six types, leaving styles and text intact', () => {
  const doc = new SvgDocument();
  doc.add(new Group('flow'));
  doc.add(new Group('node'), 'flow');
  doc.add(new Rect('r', 1, 2, 3, 4), 'node');
  doc.add(new Text('t', 5, 6, '开始 & finish'), 'node');
  doc.add(new Circle('c', 7, 8, 9), 'flow');
  doc.add(new Ellipse('e', 10, 11, 12, 13), 'flow');
  doc.add(new Line('l', 14, 15, 16, 17), 'flow');
  doc.set('flow', 'fill', 'red');
  doc.set('r', 'stroke-width', '2');
  doc.move('flow', 0.5, -1);
  doc.scale('flow', 2);
  assert.deepEqual(doc.require('r').attributes, { x: 3, y: 2, width: 6, height: 8, 'stroke-width': '2' });
  assert.deepEqual(doc.require('t').attributes, { x: 11, y: 10, text: '开始 & finish' });
  assert.deepEqual(doc.require('c').attributes, { cx: 15, cy: 14, r: 18 });
  assert.deepEqual(doc.require('e').attributes, { cx: 21, cy: 20, rx: 24, ry: 26 });
  assert.deepEqual(doc.require('l').attributes, { x1: 29, y1: 28, x2: 33, y2: 32 });
  assert.equal(doc.require('flow').attributes['fill'], 'red');
});

test('overflow in a later descendant leaves the entire subtree unchanged', () => {
  const doc = new SvgDocument();
  doc.add(new Group('g'));
  doc.add(new Rect('safe', 1, 2, 3, 4), 'g');
  doc.add(new Circle('large', Number.MAX_VALUE, 2, 3), 'g');
  assert.throws(() => doc.scale('g', 2), /finite/);
  assert.equal(doc.require('safe').attributes['x'], 1);
  assert.equal(doc.require('large').attributes['cx'], Number.MAX_VALUE);
  assert.throws(() => doc.move('g', Number.MAX_VALUE, 0), /finite/);
  assert.equal(doc.require('safe').attributes['x'], 1);
});

test('invalid properties, geometry and canvas sizes do not change state', () => {
  const doc = new SvgDocument(400, 300);
  doc.add(new Rect('r', -1, 0.5, 0, 2));
  const before = doc.require('r').attributes;
  for (const [attr, value] of [['width', '-1'], ['x', 'NaN'], ['y', ''], ['stroke-width', '-2'], ['id', 'new']]) {
    assert.throws(() => doc.set('r', attr!, value!));
    assert.deepEqual(doc.require('r').attributes, before);
  }
  for (const factor of [0, -1, NaN, Infinity]) assert.throws(() => doc.scale('r', factor), /positive/);
  assert.throws(() => doc.resize(500, -1));
  assert.deepEqual([doc.width, doc.height], [400, 300]);
  assert.throws(() => new Circle('bad', 1, 2, -3));
  assert.throws(() => new Text('', 0, 0, ''));
  doc.set('r', 'fill', '#fff');
  assert.equal(doc.require('r').attributes['fill'], '#fff');
});

test('ids are unique across branches, case sensitive, and parent targets are validated', () => {
  const doc = new SvgDocument();
  doc.add(new Group('a')); doc.add(new Group('b'));
  doc.add(new Circle('c', 1, 2, 3), 'a');
  assert.throws(() => doc.add(new Circle('c', 0, 0, 1), 'b'), /id already exists/);
  doc.add(new Circle('C', 0, 0, 1), 'b');
  assert.throws(() => doc.add(new Group('x'), 'missing'), /no such container/);
  assert.throws(() => doc.add(new Group('x'), 'c'), /not a container/);
  assert.equal(doc.find('x'), undefined);
  assert.equal(doc.parentOf('c')?.id, 'a');
  assert.equal(doc.parentOf('a'), undefined);
});

test('group uses document order, ungroup preserves position, and z-order stays local', () => {
  const doc = new SvgDocument();
  doc.add(new Group('scene'));
  for (const id of ['a', 'b', 'c', 'd']) doc.add(new Rect(id, 0, 0, 1, 1), 'scene');
  doc.group('pair', ['c', 'b']);
  assert.deepEqual(doc.require('scene').children.map(s => s.id), ['a', 'pair', 'd']);
  assert.deepEqual(doc.require('pair').children.map(s => s.id), ['b', 'c']);
  doc.ungroup('pair');
  assert.deepEqual(doc.require('scene').children.map(s => s.id), ['a', 'b', 'c', 'd']);
  doc.front('a'); doc.back('d');
  assert.deepEqual(doc.require('scene').children.map(s => s.id), ['d', 'b', 'c', 'a']);
  assert.throws(() => doc.ungroup('scene'), /top-level/);
  assert.deepEqual(doc.children.map(s => s.id), ['scene']);
});

test('cycles and ancestor selections are rejected before changing parents', () => {
  const doc = new SvgDocument();
  doc.add(new Group('a')); doc.add(new Group('b'), 'a');
  doc.add(new Text('t', 1, 2, 'hello'), 'b');
  assert.throws(() => doc.addTo('b', 'a'), /descendant/);
  assert.throws(() => doc.addTo('a', 'a'), /descendant/);
  assert.throws(() => doc.group('bad', ['t', 'a']), /descendant/);
  assert.throws(() => doc.group('bad', ['t', 't']), /duplicate/);
  assert.throws(() => doc.group('bad', ['t', 'missing']), /no such shape/);
  assert.equal(doc.find('bad'), undefined);
  assert.equal(doc.parentOf('b')?.id, 'a');
  assert.equal(doc.parentOf('t')?.id, 'b');
});

test('cross-parent grouping follows depth-first order and insertion at first selected position', () => {
  const doc = new SvgDocument();
  doc.add(new Group('a')); doc.add(new Group('b'));
  doc.add(new Text('t1', 0, 0, '1'), 'a');
  doc.add(new Text('t2', 0, 0, '2'), 'b');
  doc.group('g', ['t2', 't1']);
  assert.equal(doc.parentOf('g')?.id, 'a');
  assert.deepEqual(doc.require('g').children.map(s => s.id), ['t1', 't2']);
  assert.equal(doc.require('b').children.length, 0);
  doc.addTo('b', 'g');
  assert.equal(doc.parentOf('g')?.id, 'b');
  assert.equal(doc.require('a').children.length, 0);
});

test('deletion removes a subtree, releases ids, and rejects shared ownership across documents', () => {
  const doc = new SvgDocument(); const other = new SvgDocument();
  const group = new Group('g');
  doc.add(group); doc.add(new Circle('c', 0, 0, 1), 'g');
  assert.throws(() => other.add(group), /belongs/);
  const removed = doc.delete('g');
  assert.equal(doc.find('g'), undefined); assert.equal(doc.find('c'), undefined);
  other.add(removed);
  assert.equal(other.parentOf('c')?.id, 'g');
  assert.throws(() => doc.add(other.require('c')), /belongs/);
  doc.add(new Circle('c', 0, 0, 1));
});

test('callers cannot mutate exposed children or attribute snapshots', () => {
  const doc = new SvgDocument(); doc.add(new Group('g'));
  doc.add(new Rect('r', 1, 2, 3, 4), 'g');
  assert.throws(() => (doc.children as unknown[]).pop(), TypeError);
  assert.throws(() => (doc.require('g').children as unknown[]).pop(), TypeError);
  assert.throws(() => { (doc.require('r').attributes as Record<string, number>)['x'] = 99; }, TypeError);
  assert.equal(doc.require('r').attributes['x'], 1);
  assert.throws(() => (doc.require('g') as Group).replaceChildren([], Symbol()), /authority/);
});

test('type-specific setters accept only their own geometry and text attributes', () => {
  const doc = new SvgDocument();
  doc.add(new Rect('r', 0, 0, 1, 1));
  doc.add(new Circle('c', 0, 0, 1));
  doc.add(new Ellipse('e', 0, 0, 1, 1));
  doc.add(new Line('l', 0, 0, 1, 1));
  doc.add(new Text('t', 0, 0, 'old'));
  doc.add(new Group('g'));
  for (const [id, attr] of [['r', 'height'], ['c', 'r'], ['e', 'rx'], ['l', 'x2'], ['t', 'x']]) {
    doc.set(id!, attr!, '2.5');
    assert.equal(doc.require(id!).attributes[attr!], 2.5);
  }
  doc.set('t', 'text', 'new title with spaces');
  assert.equal(doc.require('t').attributes['text'], 'new title with spaces');
  for (const id of ['r', 'c', 'e', 'l', 'g']) assert.throws(() => doc.set(id, 'text', 'x'), /unknown attribute/);
  assert.throws(() => doc.set('g', 'x', '1'), /unknown attribute/);
  assert.throws(() => doc.set('c', 'width', '1'), /unknown attribute/);
});
