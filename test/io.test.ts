import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SvgReader } from '../src/infrastructure/SvgReader.js';
import { SvgWriter } from '../src/infrastructure/SvgWriter.js';
import { SvgFileStore } from '../src/infrastructure/SvgFileStore.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { TreeFormatter } from '../src/cli/TreeFormatter.js';

const externalSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1"><rect id="r2" x="0" y="0" width="10" height="10"/><circle id="c2" cx="5" cy="5" r="2"/></g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>`;

test('assignment external SVG imports with hierarchy, dimensions, count and missing-id warning', () => {
  const result = new SvgReader().parse(externalSvg);
  assert.deepEqual(result.warnings, ['warning: assigned id rect1 to unnamed <rect>']);
  assert.deepEqual([result.document.width, result.document.height, result.document.elementCount], [400, 300, 7]);
  assert.equal(result.document.parentOf('r2')?.id, 'g1');
  assert.equal(result.document.require('t1').content, 'imported');
  assert.equal(result.document.require('c1').attributes['fill'], undefined);
});

test('auto ids avoid later explicit ids across the complete tree and remain case sensitive', () => {
  const result = new SvgReader().parse(`<svg><rect/><g><rect id="rect1"/><rect id="rect2"/></g><rect/><rect id="Rect3"/></svg>`);
  assert.deepEqual(result.warnings, [
    'warning: assigned id rect3 to unnamed <rect>',
    'warning: assigned id g1 to unnamed <g>',
    'warning: assigned id rect4 to unnamed <rect>',
  ]);
  assert.equal(result.document.elementCount, 6);
  assert.ok(result.document.find('Rect3'));
  assert.ok(result.document.find('rect3'));
  assert.throws(() => new SvgReader().parse('<svg><g id="x"><rect id="x"/></g></svg>'), /id already exists: x/);
});

test('XML entities, CDATA, empty text, comments and namespace prefixes survive semantic round-trip', () => {
  const reader = new SvgReader(); const writer = new SvgWriter();
  const result = reader.parse(`<s:svg xmlns:s="http://www.w3.org/2000/svg" width="100px" height="200px">
    <!-- comment -->
    <s:g id="g" fill="red" stroke="black" stroke-width="2px">
      <s:text id="t" x="1.5px" y="-2"> A &amp; B &lt;C&gt; &quot;D&quot;<![CDATA[ & literal < > ]]> </s:text>
      <s:text id="empty"/>
      <s:line id="l" x1="1" y1="2" x2="3" y2="4"/>
    </s:g>
  </s:svg>`);
  const xml = writer.serialize(result.document);
  assert.match(xml, /&amp;/); assert.match(xml, /&lt;/);
  assert.doesNotMatch(xml, /\stext=/);
  const again = reader.parse(xml);
  assert.equal(again.document.require('t').content, ' A & B <C> "D" & literal < >  ');
  assert.equal(again.document.require('empty').content, '');
  assert.equal(again.document.require('g').attributes['stroke-width'], '2');
  assert.equal(again.document.require('l').attributes['stroke'], undefined);
  assert.equal(new TreeFormatter().format(again.document), new TreeFormatter().format(result.document));
  assert.deepEqual(again.warnings, []);
});

test('all CLI-created shapes round-trip after geometry, style, text and z-order edits', () => {
  const session = new EditorSession(); const cli = new CommandDispatcher(session);
  for (const line of [
    'init 500.5 300', 'create g g', 'create rect r 1 2 3 4 red in g',
    'create circle c 1 2 3 in g', 'create ellipse e 1 2 3 4 blue in g',
    'create line l 1 2 3 4 black in g', 'create text t 1 2 "A & B <C>" in g',
    'set r stroke-width 2.5', 'move g 0.25 -1', 'scale g 1.3', 'front r',
  ]) assert.doesNotMatch(cli.dispatch(line)!, /^error:/, line);
  const imported = new SvgReader().parse(new SvgWriter().serialize(session.document));
  assert.equal(new TreeFormatter().format(imported.document), cli.dispatch('tree'));
  assert.deepEqual(imported.warnings, []);
});

test('malformed XML and unsupported SVG are rejected rather than silently discarded', () => {
  for (const source of [
    '', '<html/>', '<svg><rect></svg>', '<svg><g id="a" id="b"/></svg>', '<svg><text>&bogus;</text></svg>',
    '<svg><rect width="-1"/></svg>', '<svg width="NaN"/>', '<svg><circle r="-1"/></svg>',
    '<svg><path d="M 0 0"/></svg>', '<svg><g transform="translate(1,,2)"/></svg>',
    '<svg><rect style="unsupported-property:red"/></svg>', '<svg><text><tspan>nested</tspan></text></svg>',
    '<svg><rect><circle/></rect></svg>', '<svg>unexpected</svg>', '<svg><g>unexpected</g></svg>',
    '<svg viewBox="0 0 1"/>', '<svg width="200" height="100" viewBox="0 0 -100 100"/>',
    '<svg xmlns="http://example.com/other"/>', '<svg><g xmlns="http://example.com/other"/></svg>',
    '<svg><g id="white space"/></svg>', '<svg width="100%"/>', '<svg unsupported-root-attribute="red"/>',
    '<!DOCTYPE svg [<!ENTITY x "text">]><svg/>', '<?xml-stylesheet href="external.css"?><svg/>',
    '<svg><g><?thing data?></g></svg>',
  ]) assert.throws(() => new SvgReader().parse(source), /invalid SVG:/, source);
});

test('empty canvas, numeric defaults and matching viewBox import deterministically', () => {
  const reader = new SvgReader();
  assert.deepEqual([reader.parse('<svg/>').document.width, reader.parse('<svg/>').document.height], [800, 600]);
  const result = reader.parse('<svg viewBox="0,0,400,300"><circle id="c"/><text id="t"/></svg>');
  assert.deepEqual([result.document.width, result.document.height], [400, 300]);
  assert.deepEqual(result.document.require('c').attributes, { cx: 0, cy: 0, r: 0 });
  const empty = new EditorSession(); empty.init();
  assert.equal(reader.parse(new SvgWriter().serialize(empty.document)).document.elementCount, 0);
});

test('read warnings appear only after full success, and failures preserve document, path and redo', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-io-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const valid = join(directory, 'valid.svg'); const bad = join(directory, 'bad.svg');
  writeFileSync(valid, externalSvg);
  writeFileSync(bad, '<svg><rect/><path/></svg>');
  const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
  assert.equal(cli.dispatch(`read "${valid}"`), `warning: assigned id rect1 to unnamed <rect>\nread ${valid} (7 elements)`);
  assert.equal(session.filePath, valid);
  assert.equal(cli.dispatch('undo'), 'error: undo not allowed after io command');
  cli.dispatch('move c1 10 20'); cli.dispatch('undo');
  const before = cli.dispatch('tree'); const original = session.document;
  for (const path of [bad, join(directory, 'missing.svg')]) {
    const output = cli.dispatch(`read "${path}"`)!;
    assert.match(output, /^error: [^\n]+$/);
    assert.doesNotMatch(output, /warning:/);
    assert.equal(cli.dispatch('tree'), before);
    assert.equal(session.document, original);
    assert.equal(session.filePath, valid);
  }
  assert.match(cli.dispatch('redo')!, /^redone:/);
  assert.equal(session.document.require('c1').attributes['cx'], 60);
});

test('implicit save retains the read path, and first explicit save establishes a new-document path', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-path-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const first = join(directory, 'first name.svg'); const second = join(directory, 'second.svg');
  const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
  assert.equal(cli.dispatch('save'), "error: no document. use 'init' or 'read' first");
  cli.dispatch('init'); cli.dispatch('create rect r 0 0 1 1');
  assert.equal(cli.dispatch('save'), "error: no file path. use 'save <file.svg>' first");
  assert.equal(cli.dispatch(`save "${first}"`), `saved to ${first} (1 elements)`);
  assert.equal(session.filePath, first);
  assert.equal(cli.dispatch('redo'), 'error: undo not allowed after io command');
  cli.dispatch('move r 3 4'); cli.dispatch('save');
  assert.equal(new SvgFileStore().read(first).document.require('r').attributes['x'], 3);
  cli.dispatch(`save "${second}"`); cli.dispatch('move r 2 0'); cli.dispatch('save');
  assert.equal(session.filePath, first);
  assert.equal(new SvgFileStore().read(second).document.require('r').attributes['x'], 3);
  assert.equal(new SvgFileStore().read(first).document.require('r').attributes['x'], 5);
  cli.dispatch('init'); assert.equal(session.filePath, undefined);
  assert.match(cli.dispatch('save')!, /^error: no file path/);
  cli.dispatch(`read "${first}"`); cli.dispatch('move r 1 0'); cli.dispatch('save');
  assert.equal(new SvgFileStore().read(first).document.require('r').attributes['x'], 6);
});

test('failed saves preserve file contents, path, document and redo; successful save resets history', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-fail-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const output = join(directory, 'original.svg'); const missing = join(directory, 'missing', 'file.svg');
  const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
  cli.dispatch('init'); cli.dispatch('create text t 1 2 "original"'); cli.dispatch(`save "${output}"`);
  const contents = readFileSync(output, 'utf8');
  cli.dispatch('move t 5 6'); cli.dispatch('undo'); const before = cli.dispatch('tree');
  assert.equal(cli.dispatch(`save "${missing}"`), `error: cannot write file: ${missing}`);
  assert.equal(cli.dispatch('tree'), before); assert.equal(session.filePath, output);
  assert.match(cli.dispatch('redo')!, /^redone:/);
  cli.dispatch('set t text "bad\u0000text"');
  assert.equal(cli.dispatch('save'), `error: cannot write file: ${output}`);
  assert.equal(readFileSync(output, 'utf8'), contents);
  assert.equal(session.filePath, output);
  assert.match(cli.dispatch('undo')!, /^undone:/);
  assert.match(cli.dispatch('save')!, /^saved to /);
  assert.equal(cli.dispatch('undo'), 'error: undo not allowed after io command');
  cli.dispatch('set t fill blue'); cli.dispatch('undo');
  assert.equal(session.document.require('t').attributes['fill'], undefined);
  assert.deepEqual(readdirSync(directory).sort(), ['original.svg']);
});

test('atomic saves reject directories, read-only files and symlinks without altering originals', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-atomic-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const target = join(directory, 'original.svg'); const link = join(directory, 'link.svg');
  writeFileSync(target, 'original'); symlinkSync(target, link);
  const session = new EditorSession(); session.init(); const store = new SvgFileStore();
  assert.throws(() => store.write(session.document, directory), /cannot write file/);
  assert.throws(() => store.write(session.document, link), /cannot write file/);
  assert.equal(readFileSync(target, 'utf8'), 'original');
  chmodSync(target, 0o444); t.after(() => { try { chmodSync(target, 0o644); } catch { /* removed */ } });
  assert.throws(() => store.write(session.document, target), /cannot write file/);
  assert.equal(readFileSync(target, 'utf8'), 'original');
  chmodSync(target, 0o644); store.write(session.document, target);
  assert.match(readFileSync(target, 'utf8'), /<svg/);
  assert.deepEqual(readdirSync(directory).sort(), ['link.svg', 'original.svg']);
});

test('read/save argument errors do not change current state or consume undo', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-args-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
  cli.dispatch('init'); cli.dispatch('create g g');
  const before = cli.dispatch('tree');
  for (const line of ['read', 'read ""', 'read a b', 'save ""', 'save a b']) {
    assert.match(cli.dispatch(line)!, /^error: usage:/);
    assert.equal(cli.dispatch('tree'), before);
  }
  assert.match(cli.dispatch('undo')!, /^undone:/);
  assert.equal(session.document.elementCount, 0);
});

test('actual CLI reads, edits, saves and rereads files with spaces, continuing after IO barrier errors', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-repl-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = join(directory, 'input file.svg'); const output = join(directory, 'output file.svg');
  writeFileSync(input, externalSvg);
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: process.cwd(), encoding: 'utf8', input: [
      `read "${input}"`, 'undo', 'move c1 10 20', `save "${output}"`, 'undo', `read "${output}"`, 'show c1',
    ].join('\n') + '\n',
  });
  assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
  assert.match(result.stdout, /warning: assigned id rect1/);
  assert.equal(result.stdout.match(/error: undo not allowed after io command/g)?.length, 2);
  assert.match(result.stdout, /cx=60/); assert.match(result.stdout, /cy=70/);
  assert.equal(new SvgFileStore().read(output).document.require('c1').attributes['cx'], 60);
});


test('a successful read replaces the old document and history; failed initial reads leave no document', t => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-replace-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = join(directory, 'input.svg'); writeFileSync(input, externalSvg);
  const session = new EditorSession(new SvgFileStore()); const cli = new CommandDispatcher(session);
  assert.match(cli.dispatch(`read "${join(directory, 'missing.svg')}"`)!, /^error: cannot read file:/);
  assert.equal(cli.dispatch('tree'), "error: no document. use 'init' or 'read' first");
  assert.equal(session.filePath, undefined);
  cli.dispatch('init'); cli.dispatch('create rect old 0 0 1 1'); cli.dispatch('move old 1 1'); cli.dispatch('undo');
  cli.dispatch(`read "${input}"`);
  assert.equal(session.document.find('old'), undefined);
  assert.equal(cli.dispatch('redo'), 'error: undo not allowed after io command');
  const imported = cli.dispatch('tree');
  cli.dispatch('set c1 fill red'); cli.dispatch('undo');
  assert.equal(cli.dispatch('tree'), imported);
  assert.equal(cli.dispatch('undo'), 'error: nothing to undo');
});
