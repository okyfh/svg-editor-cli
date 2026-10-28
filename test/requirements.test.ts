import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SvgReader } from '../src/infrastructure/SvgReader.js';
import { SvgWriter } from '../src/infrastructure/SvgWriter.js';
import { SvgFileStore } from '../src/infrastructure/SvgFileStore.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { TreeFormatter } from '../src/cli/TreeFormatter.js';

test('every SVG shown in the assignment reads and round-trips, including rendered previews', () => {
  const markdown = readFileSync('doc/assignment.md', 'utf8');
  const sources = [...markdown.matchAll(/<svg\b(?=[^>]*\b(?:xmlns|width)\s*=)[^>]*>[\s\S]*?<\/svg>/g)].map(match => match[0]);
  assert.ok(sources.length >= 5);
  for (const source of sources) {
    const first = new SvgReader().parse(source);
    const second = new SvgReader().parse(new SvgWriter().serialize(first.document));
    assert.equal(new TreeFormatter().format(second.document), new TreeFormatter().format(first.document));
    assert.equal(second.document.elementCount, first.document.elementCount);
    assert.deepEqual(second.warnings, []);
    assert.deepEqual(second.document.svgAttributes, first.document.svgAttributes);
  }
});

test('assignment nested transforms normalize into canvas coordinates without losing text appearance', () => {
  const result = new SvgReader().parse(readFileSync('examples/assignment-transform.svg', 'utf8'));
  assert.deepEqual(result.warnings, [
    'warning: assigned id rect1 to unnamed <rect>', 'warning: assigned id text1 to unnamed <text>',
  ]);
  assert.deepEqual(result.document.require('a').attributes, { x: 60, y: 40, width: 120, height: 60, fill: '#4a90d9' });
  assert.deepEqual(result.document.require('rect1').attributes, { x: 260, y: 40, width: 96, height: 48, fill: '#f5a623', 'stroke-width': '0.8' });
  const label = result.document.require('text1');
  assert.equal(label.attributes['x'], 308); assert.equal(label.attributes['y'], 70.4);
  assert.equal(label.attributes['font-size'], '12.8'); assert.equal(label.attributes['text-anchor'], 'middle');
  assert.equal(label.attributes['fill'], 'white'); assert.equal(label.content, 'End');
  assert.equal(result.document.parentOf('text1')?.id, 'nodeB');
  const xml = new SvgWriter().serialize(result.document);
  assert.doesNotMatch(xml, /transform=/);
  assert.match(xml, /font-size="12.8"/); assert.match(xml, /text-anchor="middle"/);
});

test('transform order, inherited stroke/font size and root transforms compose correctly', () => {
  const doc = new SvgReader().parse(`<svg transform="translate(10,20)" stroke="black" stroke-width="2" stroke-dasharray="4 2" stroke-dashoffset="1" font-size="10">
    <g id="g" transform="scale(2) translate(3,4)">
      <rect id="r" x="1" y="2" width="3" height="4"/>
      <text id="t" x="1" y="2" font-size="inherit">Text</text>
      <circle id="c" cx="1" cy="2" r="3" stroke-width="3" transform="translate(5) scale(.5,.5)"/>
    </g></svg>`).document;
  assert.equal(doc.require('r').attributes['x'], 18); assert.equal(doc.require('r').attributes['y'], 32);
  assert.equal(doc.require('r').attributes['stroke-width'], '4');
  assert.equal(doc.require('r').attributes['stroke-dasharray'], '8 4');
  assert.equal(doc.require('r').attributes['stroke-dashoffset'], '2');
  assert.equal(doc.require('t').attributes['font-size'], '20');
  assert.equal(doc.require('c').attributes['cx'], 27); assert.equal(doc.require('c').attributes['cy'], 30);
  assert.equal(doc.require('c').attributes['r'], 3); assert.equal(doc.require('c').attributes['stroke-width'], '3');
  assert.equal(doc.svgAttributes['stroke'], 'black');
  const again = new SvgReader().parse(new SvgWriter().serialize(doc)).document;
  assert.deepEqual(again.require('t').attributes, doc.require('t').attributes);
});

test('inline presentation style wins over attributes and !important ordering is respected', () => {
  const doc = new SvgReader().parse(`<svg style="border:1px solid #ddd;background:#fafafa" viewBox="-10 -20 100 80" width="200" height="160">
    <g id="g" style="fill:red; stroke:blue; font-size:10px">
      <text id="t" x="1" y="2" fill="green" style="fill: white !important; fill:black; font-family:'A; B'; /* note */ text-anchor:middle; font-size:12px">Label</text>
      <rect id="r" width="10" height="10" style="fill:orange;stroke-width:2px"/>
    </g></svg>`).document;
  assert.equal(doc.require('t').attributes['fill'], 'white');
  assert.equal(doc.require('t').attributes['font-size'], '12px');
  assert.equal(doc.require('t').attributes['font-family'], "'A; B'");
  assert.equal(doc.require('t').attributes['text-anchor'], 'middle');
  assert.equal(doc.require('r').attributes['stroke-width'], '2');
  const xml = new SvgWriter().serialize(doc);
  assert.match(xml, /viewBox="-10 -20 100 80"/); assert.match(xml, /background:#fafafa/);
  assert.deepEqual(new SvgReader().parse(xml).document.svgAttributes, doc.svgAttributes);
  assert.throws(() => doc.set('t', 'font-size', '20'), /unknown attribute: font-size/);
  assert.throws(() => doc.set('t', 'transform', 'scale(2)'), /unknown attribute: transform/);
});

test('imported transform results support edit, regroup, ungroup, delete, undo and redo', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-required-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
  assert.doesNotMatch(cli.dispatch('read examples/assignment-transform.svg')!, /^error:/);
  const original = cli.dispatch('tree');
  for (const command of ['move nodeB 0 10', 'scale nodeB 2', 'set text1 text "Finish"', 'group pair rect1 text1', 'ungroup pair', 'addto diagram text1', 'front a', 'back e', 'delete nodeB']) {
    const before = cli.dispatch('tree');
    assert.doesNotMatch(cli.dispatch(command)!, /^error:/, command);
    const after = cli.dispatch('tree');
    cli.dispatch('undo'); assert.equal(cli.dispatch('tree'), before, command);
    cli.dispatch('redo'); assert.equal(cli.dispatch('tree'), after, command);
  }
  const path = join(directory, 'edited.svg');
  assert.doesNotMatch(cli.dispatch(`save "${path}"`)!, /^error:/);
  const saved = cli.dispatch('tree'); cli.dispatch(`read "${path}"`);
  assert.equal(cli.dispatch('tree'), saved); assert.notEqual(saved, original);
});

test('exact chapter 6 command transcript replays with only its two intended errors', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-transcript-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const markdown = readFileSync('doc/assignment.md', 'utf8');
  const section = markdown.split('## 6. 典型会话')[1]!.split('### 6.1')[0]!;
  const commands = [...section.matchAll(/^svg> (.+)$/gm)].map(match => match[1]!);
  const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
  const errors: string[] = [];
  for (const original of commands) {
    const command = original.replace('save demo.svg', `save "${join(directory, 'demo.svg')}"`).replace('read other.svg', 'read examples/other.svg');
    const result = cli.dispatch(command)!;
    if (result.startsWith('error:')) errors.push(result);
  }
  assert.deepEqual(errors, [
    'error: cannot group a container into its own descendant: markers',
    'error: undo not allowed after io command',
  ]);
  const saved = new SvgFileStore().read(join(directory, 'demo.svg')).document;
  assert.equal(saved.elementCount, 5);
  assert.equal(saved.require('c1').attributes['cx'], 130);
  assert.equal(saved.require('title').content, 'My Diagram');
  assert.equal(saved.parentOf('box')?.id, 'markers');
  assert.equal(session.document.elementCount, 7);
});

test('the published error table matches and rejected edits leave tree and redo intact', () => {
  const cli = new CommandDispatcher(new EditorSession()); cli.dispatch('init');
  cli.dispatch('create g scene'); cli.dispatch('create rect r1 0 0 1 1 in scene');
  cli.dispatch('move r1 1 2'); cli.dispatch('undo'); const before = cli.dispatch('tree');
  const cases = new Map([
    ['create rect r1 0 0 1 1', 'error: id already exists: r1'],
    ['delete r9', 'error: no such shape: r9'],
    ['create g x in node9', 'error: no such container: node9'],
    ['create g x in r1', 'error: not a container: r1'],
    ['create hexagon x', 'error: unknown shape type: hexagon (is the plugin loaded?)'],
    ['create box x', 'error: unknown shape type: box (is the plugin loaded?)'],
    ['group bad r1 scene', 'error: cannot group a container into its own descendant: scene'],
    ['ungroup scene', 'error: cannot ungroup top-level container: scene'],
    ['scale r1 0', 'error: scale factor must be positive'],
    ['scale r1 -1', 'error: scale factor must be positive'],
  ]);
  for (const [command, expected] of cases) {
    assert.equal(cli.dispatch(command), expected); assert.equal(cli.dispatch('tree'), before);
  }
  assert.match(cli.dispatch('group single r1')!, /^error:/);
  assert.match(cli.dispatch('redo')!, /^redone:/);
});

test('viewBox and root styles persist through history; canvas resize resets its coordinate box', () => {
  const store = new SvgFileStore();
  const session = new EditorSession({
    read: () => new SvgReader().parse('<svg width="200" height="100" viewBox="-10 -20 400 200" fill="red"><rect id="r" width="2" height="3"/></svg>'),
    write: (doc, path) => store.write(doc, path),
  });
  const cli = new CommandDispatcher(session); cli.dispatch('read input.svg');
  cli.dispatch('move r 1 2'); cli.dispatch('undo'); cli.dispatch('redo');
  assert.equal(session.document.svgAttributes['viewBox'], '-10 -20 400 200');
  assert.equal(session.document.svgAttributes['fill'], 'red');
  cli.dispatch('canvas 500 400');
  assert.match(new SvgWriter().serialize(session.document), /viewBox="0 0 500 400"/);
  assert.equal(session.document.svgAttributes['fill'], 'red');
});

test('invalid transform syntax, style and overflow fail before replacing the document', () => {
  for (const transform of ['scale(0)', 'scale(-1)', 'scale(2,3)', 'scale(2,)', 'translate(1,,2)', 'rotate(90)', 'translate(1e999)', 'scale(1e308) scale(1e308)', 'translate(1) trailing']) {
    assert.throws(() => new SvgReader().parse(`<svg><g transform="${transform}"><rect width="10" height="10"/></g></svg>`), /invalid SVG:/);
  }
  for (const style of ['font-size:-1', 'fill', 'fill:red; font-size:bad', 'fill:red /*', 'fill:rgb(1,2,3']) {
    assert.throws(() => new SvgReader().parse(`<svg><text style="${style}">x</text></svg>`), /invalid SVG:/);
  }
});


test('literal metadata values named inherit are not treated as CSS keywords', () => {
  const document = new SvgReader().parse('<svg><text id="inherit" data-kind="inherit">inherit</text></svg>').document;
  assert.equal(document.require('inherit').content, 'inherit');
  assert.equal(document.require('inherit').attributes['data-kind'], 'inherit');
});


test('inline transform precedence is applied once on leaves and root', () => {
  const document = new SvgReader().parse('<svg transform="translate(100)" style="transform:translate(5px,6px);background:white"><rect id="r" x="1" y="2" width="3" height="4" transform="translate(200)" style="transform:translate(20px,30px) scale(2)"/></svg>').document;
  assert.equal(document.require('r').attributes['x'], 27);
  assert.equal(document.require('r').attributes['y'], 40);
  const xml = new SvgWriter().serialize(document);
  assert.doesNotMatch(xml, /transform/);
  assert.match(xml, /background:white/);
  assert.equal(new SvgReader().parse(xml).document.require('r').attributes['x'], 27);
});
