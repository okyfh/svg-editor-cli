import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { EditorSession } from '../src/application/EditorSession.js';

test('tokenizer preserves quoted content, empty text, escaped quotes and color hashes', () => {
  const parser = new Tokenizer();
  assert.deepEqual(parser.tokenize('  # comment'), []);
  assert.deepEqual(parser.tokenize(' \t '), []);
  const tokens = parser.tokenize('create text t 1 2 "say \\"hi\\" \\\\ end"');
  assert.equal(tokens[5]?.value, 'say "hi" \\ end');
  assert.equal(tokens[5]?.isQuoted, true);
  assert.equal(parser.tokenize('""')[0]?.value, '');
  assert.equal(parser.tokenize('red #ffffff')[1]?.value, '#ffffff');
  for (const line of ['"bad', 'a"b"', '"a"b']) assert.throws(() => parser.tokenize(line));
});

test('no-document errors, help, unknown and pending commands are explicit', () => {
  const cli = new CommandDispatcher();
  assert.equal(cli.dispatch('# comment'), undefined);
  assert.equal(cli.dispatch(''), undefined);
  for (const line of ['create g a', 'tree', 'show a', 'canvas', 'undo', 'save']) {
    assert.equal(cli.dispatch(line), "error: no document. use 'init' or 'read' first");
  }
  const help = cli.dispatch('help')!;
  for (const name of ['init', 'read', 'save', 'canvas', 'create', 'delete', 'move', 'scale', 'set', 'group', 'ungroup', 'addto', 'front', 'back', 'tree', 'show', 'help', 'undo', 'redo']) {
    assert.match(help, new RegExp(`^${name}(?: |$)`, 'm'));
  }
  assert.match(cli.dispatch('help extra')!, /^error: usage:/);
  assert.equal(cli.dispatch('wat'), 'error: unknown command: wat');
  assert.equal(cli.dispatch('read file.svg'), 'error: command is planned for stage 5');
  cli.dispatch('init');
  assert.equal(cli.dispatch('undo'), 'error: undo not allowed after io command');
});

test('all built-in shapes create with defaults, colors, float coordinates and quoted text', () => {
  const session = new EditorSession(); const cli = new CommandDispatcher(session);
  assert.equal(cli.dispatch('init'), 'canvas 800x600 created');
  assert.equal(cli.dispatch('create g scene'), 'g#scene created');
  assert.equal(cli.dispatch('create rect r -1.5 2 30 40 #ffffff in scene'), 'rect#r created in g#scene');
  assert.equal(cli.dispatch('create circle c 1 2 3'), 'circle#c created');
  assert.equal(cli.dispatch('create ellipse e 1 2 3 4 blue'), 'ellipse#e created');
  assert.equal(cli.dispatch('create line l 1 2 3 4 black'), 'line#l created');
  assert.equal(cli.dispatch('create text t 1 2 "My Diagram v1" in scene'), 'text#t created in g#scene');
  assert.equal(cli.dispatch('create text blank 0 0 ""'), 'text#blank created');
  assert.equal(session.document.require('r').attributes['fill'], '#ffffff');
  assert.equal(session.document.require('c').attributes['fill'], undefined);
  assert.equal(session.document.require('l').attributes['stroke'], 'black');
  assert.equal(session.document.require('t').attributes['text'], 'My Diagram v1');
  assert.equal(session.document.parentOf('t')?.id, 'scene');
});

test('literal in and escaped quotes do not become container clauses', () => {
  const session = new EditorSession(); const cli = new CommandDispatcher(session); cli.dispatch('init');
  assert.equal(cli.dispatch('create g in'), 'g#in created');
  assert.equal(cli.dispatch('create text in-label 0 0 "in" in in'), 'text#in-label created in g#in');
  assert.equal(cli.dispatch('create text phrase 0 0 "work in scene"'), 'text#phrase created');
  assert.equal(cli.dispatch('create text quote 0 0 "say \\"hi\\""'), 'text#quote created');
  assert.equal(session.document.require('quote').attributes['text'], 'say "hi"');
  assert.equal(cli.dispatch('create text noquote 0 0 hello'), 'error: text content must be enclosed in double quotes');
  assert.equal(session.document.find('noquote'), undefined);
});

test('invalid create and resize leave document, dimensions and existing tree unchanged', () => {
  const session = new EditorSession(); const cli = new CommandDispatcher(session);
  cli.dispatch('init 400 300'); cli.dispatch('create g g'); cli.dispatch('create circle c 0 0 1 in g');
  const before = cli.dispatch('tree');
  for (const line of [
    'create circle c 0 0 1', 'create rect bad 0 0 -1 2', 'create rect bad 0 0 1',
    'create circle bad NaN 0 1', 'create circle bad 0x10 0 1', 'create circle bad 1e999 0 1',
    'create circle bad 0 0 1 extra extra', 'create text bad 0 0 "unterminated',
    'create g bad in missing', 'create g bad in c', 'create g bad in',
    'create box bad 0 0 1 1 "box"', 'canvas 500', 'canvas 500 -1', 'init 500 -1', 'init 1 2 3',
  ]) {
    assert.match(cli.dispatch(line)!, /^error: [^\n]+$/, line);
    assert.equal(cli.dispatch('tree'), before, line);
    assert.deepEqual([session.document.width, session.document.height], [400, 300]);
  }
  assert.equal(cli.dispatch('create g bad in c'), 'error: not a container: c');
  assert.equal(cli.dispatch('create g bad in missing'), 'error: no such container: missing');
  assert.equal(cli.dispatch('create box bad'), 'error: unknown shape type: box (is the plugin loaded?)');
});

test('tree shows nested connectors, inline geometry and subtree; show reports parent and attributes', () => {
  const cli = new CommandDispatcher(); cli.dispatch('init 400 200');
  cli.dispatch('create g flow'); cli.dispatch('create g node in flow');
  cli.dispatch('create rect r 10 20 30 40 red in node');
  cli.dispatch('create text t 10 40 "Start" in flow');
  assert.equal(cli.dispatch('tree'), [
    'svg (400x200)', '└── g#flow', '    ├── g#node',
    '    │   └── rect#r  x=10  y=20  w=30  h=40  fill=red',
    '    └── text#t  x=10  y=40  "Start"',
  ].join('\n'));
  assert.equal(cli.dispatch('tree r'), 'rect#r  x=10  y=20  w=30  h=40  fill=red');
  assert.equal(cli.dispatch('show r'), 'rect#r  parent=g#node\n  x=10\n  y=20\n  width=30\n  height=40\n  fill="red"');
  assert.equal(cli.dispatch('show flow'), 'g#flow  parent=svg');
  assert.equal(cli.dispatch('show missing'), 'error: no such shape: missing');
  assert.match(cli.dispatch('tree one two')!, /^error: usage:/);
  assert.match(cli.dispatch('show')!, /^error: usage:/);
});

test('canvas query and resize work, single init dimension retains default height', () => {
  const cli = new CommandDispatcher();
  assert.equal(cli.dispatch('init 400'), 'canvas 400x600 created');
  assert.equal(cli.dispatch('canvas'), 'canvas 400x600');
  assert.equal(cli.dispatch('canvas 320.5 200'), 'canvas resized to 320.5x200');
  assert.equal(cli.dispatch('canvas'), 'canvas 320.5x200');
});

test('actual source REPL accepts a script, reports error and continues to EOF', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
    cwd: process.cwd(), encoding: 'utf8',
    input: '# script\ninit 100 200\ncreate circle c 1 2 3 red\ncreate g broken in missing\ntree\n',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /svg-editor 0.1/);
  assert.match(result.stdout, /svg> /);
  assert.match(result.stdout, /circle#c created/);
  assert.match(result.stdout, /error: no such container: missing/);
  assert.match(result.stdout, /svg \(100x200\)/);
  assert.match(result.stdout, /circle#c.*cx=1.*cy=2.*r=3.*fill=red/);
  assert.equal(result.stderr, '');
});
