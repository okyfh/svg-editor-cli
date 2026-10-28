import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CommandDispatcher } from '../src/cli/CommandDispatcher.js';
import { EditorSession } from '../src/application/EditorSession.js';
import { EditCommand } from '../src/application/EditCommand.js';
import { SvgDocument } from '../src/domain/SvgDocument.js';

// A failing command deliberately mutates first, exercising the transaction boundary.
class FailingEdit extends EditCommand {
  public override execute(document: SvgDocument): string {
    document.set('r', 'fill', 'bad'); document.delete('r');
    throw new Error('simulated failure');
  }
}

test('every edit is one undo unit and redo restores the entire resulting tree', () => {
  const cli = new CommandDispatcher(); cli.dispatch('init');
  for (const line of [
    'create g scene', 'create g left in scene', 'create g right in scene',
    'create rect r 1 2 3 4 in left', 'create text t 5 6 "title" in left',
    'create circle c 7 8 9 in right',
  ]) assert.doesNotMatch(cli.dispatch(line)!, /^error:/);
  const edits = [
    'create ellipse e 1 2 3 4 in scene', 'create line l 1 2 3 4 black in scene',
    'move left 0.1 -3.5', 'scale scene 1.3', 'set r width 7.25', 'set left fill red',
    'set t text "new title"', 'group pair c r', 'ungroup pair', 'addto left c',
    'front t', 'back t', 'delete left',
  ];
  for (const edit of edits) {
    const before = cli.dispatch('tree');
    const output = cli.dispatch(edit)!; assert.doesNotMatch(output, /^error:/, edit);
    const after = cli.dispatch('tree');
    assert.match(cli.dispatch('undo')!, /^undone:/, edit);
    assert.equal(cli.dispatch('tree'), before, edit);
    assert.match(cli.dispatch('redo')!, /^redone:/, edit);
    assert.equal(cli.dispatch('tree'), after, edit);
  }
});

test('multiple commands rewind to empty canvas and replay in order', () => {
  const cli = new CommandDispatcher(); cli.dispatch('init 100 200');
  const states = [cli.dispatch('tree')];
  for (const command of ['create g g', 'create rect r 0.1 0.2 0.3 0.4 in g', 'scale g 1.1', 'move g 1.2 -0.3', 'set r fill red', 'delete g']) {
    assert.doesNotMatch(cli.dispatch(command)!, /^error:/);
    states.push(cli.dispatch('tree'));
  }
  for (let index = states.length - 2; index >= 0; index--) {
    assert.match(cli.dispatch('undo')!, /^undone:/);
    assert.equal(cli.dispatch('tree'), states[index]);
  }
  assert.equal(cli.dispatch('undo'), 'error: nothing to undo');
  for (let index = 1; index < states.length; index++) {
    assert.match(cli.dispatch('redo')!, /^redone:/);
    assert.equal(cli.dispatch('tree'), states[index]);
  }
  assert.equal(cli.dispatch('redo'), 'error: nothing to redo');
});

test('failed commands and display commands preserve redo, a new edit clears it', () => {
  const cli = new CommandDispatcher(); cli.dispatch('init');
  cli.dispatch('create rect r 1 2 3 4'); cli.dispatch('move r 5 6'); cli.dispatch('undo');
  const before = cli.dispatch('tree');
  for (const line of ['scale r 0', 'set r width -1', 'create g r', 'addto r r', 'move missing 1 2', 'move r NaN 1', 'set r mystery 1', 'create text t 0 0 "bad', 'undo extra', 'redo extra']) {
    assert.match(cli.dispatch(line)!, /^error:/);
    assert.equal(cli.dispatch('tree'), before);
  }
  cli.dispatch('show r'); cli.dispatch('help'); cli.dispatch('canvas');
  assert.match(cli.dispatch('redo')!, /^redone:/);
  assert.match(cli.dispatch('show r')!, /x=6/);
  cli.dispatch('undo'); cli.dispatch('set r stroke blue');
  assert.equal(cli.dispatch('redo'), 'error: nothing to redo');
});

test('init and canvas writes form history barriers, failed writes do not', () => {
  const cli = new CommandDispatcher(); cli.dispatch('init');
  for (const verb of ['undo', 'redo']) assert.equal(cli.dispatch(verb), 'error: undo not allowed after io command');
  assert.match(cli.dispatch('create rect bad 0 0 -1 1')!, /^error:/);
  assert.equal(cli.dispatch('undo'), 'error: undo not allowed after io command');
  cli.dispatch('create rect r 1 2 3 4'); cli.dispatch('move r 5 6'); cli.dispatch('undo');
  cli.dispatch('canvas 0 1'); cli.dispatch('init -1 1');
  assert.match(cli.dispatch('redo')!, /^redone:/);
  cli.dispatch('canvas 400 300');
  assert.equal(cli.dispatch('undo'), 'error: undo not allowed after io command');
  assert.equal(cli.dispatch('redo'), 'error: undo not allowed after io command');
  cli.dispatch('set r fill red'); cli.dispatch('undo');
  assert.deepEqual(cli.dispatch('canvas'), 'canvas 400x300');
  assert.doesNotMatch(cli.dispatch('show r')!, /fill=/);
  assert.equal(cli.dispatch('undo'), 'error: nothing to undo');
  cli.dispatch('init');
  assert.equal(cli.dispatch('tree'), 'svg (800x600)');
  assert.equal(cli.dispatch('undo'), 'error: undo not allowed after io command');
});

test('set undo restores absent styles and snapshots remain reusable after later setters', () => {
  const session = new EditorSession(); const cli = new CommandDispatcher(session); cli.dispatch('init');
  cli.dispatch('create text t 0.1 0.2 "old"');
  const original = session.document.require('t');
  const before = cli.dispatch('tree');
  cli.dispatch('set t fill red'); cli.dispatch('undo');
  assert.equal(original.attributes['fill'], undefined);
  cli.dispatch('redo'); assert.equal(original.attributes['fill'], 'red');
  cli.dispatch('set t x 8'); cli.dispatch('set t text "new"');
  cli.dispatch('undo'); cli.dispatch('undo'); cli.dispatch('undo');
  assert.equal(cli.dispatch('tree'), before);
  assert.equal(session.document.require('t'), original);
  cli.dispatch('redo'); cli.dispatch('redo'); cli.dispatch('redo');
  assert.equal(original.attributes['x'], 8);
  assert.equal(original.attributes['text'], 'new');
});

test('cross-parent group and ungroup restore exact parents, sibling order and ownership', () => {
  const session = new EditorSession(); const cli = new CommandDispatcher(session); cli.dispatch('init');
  for (const line of ['create g scene', 'create g a in scene', 'create g b in scene', 'create rect r 0 0 1 1 in a', 'create text t 0 0 "t" in b']) cli.dispatch(line);
  const initial = cli.dispatch('tree');
  cli.dispatch('group pair t r');
  const grouped = cli.dispatch('tree');
  assert.equal(session.document.parentOf('pair')?.id, 'a');
  cli.dispatch('ungroup pair');
  assert.equal(session.document.find('pair'), undefined);
  cli.dispatch('undo'); assert.equal(cli.dispatch('tree'), grouped);
  cli.dispatch('undo'); assert.equal(cli.dispatch('tree'), initial);
  cli.dispatch('redo'); assert.equal(cli.dispatch('tree'), grouped);
  cli.dispatch('redo');
  assert.equal(session.document.parentOf('r')?.id, 'a');
  assert.equal(session.document.parentOf('t')?.id, 'a');
  cli.dispatch('undo'); cli.dispatch('undo');
  assert.equal(session.document.parentOf('t')?.id, 'b');
  assert.equal(cli.dispatch('create g pair'), 'g#pair created');
});

test('overflow and illegal structural edits preserve both tree and previous undo unit', () => {
  const cli = new CommandDispatcher(); cli.dispatch('init'); cli.dispatch('create g scene');
  cli.dispatch('create rect r 1 2 3 4 in scene');
  cli.dispatch(`create circle c ${Number.MAX_VALUE} 0 1 in scene`);
  const before = cli.dispatch('tree');
  for (const line of ['scale scene 2', 'addto scene scene', 'group bad scene r', 'ungroup scene', 'group bad r missing', 'group bad r r']) {
    assert.match(cli.dispatch(line)!, /^error:/);
    assert.equal(cli.dispatch('tree'), before);
  }
  assert.match(cli.dispatch('undo')!, /circle#c created/);
  assert.equal(cli.dispatch('show c'), 'error: no such shape: c');
});

test('history rolls back a partially applied command without consuming a unit or redo', () => {
  const session = new EditorSession(); const cli = new CommandDispatcher(session); cli.dispatch('init');
  cli.dispatch('create rect r 1 2 3 4'); cli.dispatch('move r 5 6'); cli.dispatch('undo');
  const before = cli.dispatch('tree');
  assert.throws(() => session.edit(new FailingEdit()), /simulated failure/);
  assert.equal(cli.dispatch('tree'), before);
  assert.match(cli.dispatch('redo')!, /^redone:/);
  assert.equal(session.document.require('r').attributes['fill'], undefined);
});

test('z-order and addto undo/redo preserve same-parent and cross-parent positions', () => {
  const cli = new CommandDispatcher(); cli.dispatch('init');
  for (const line of ['create g g', 'create g h', 'create circle a 0 0 1 in g', 'create circle b 0 0 1 in g', 'create circle c 0 0 1 in g']) cli.dispatch(line);
  for (const line of ['front a', 'back c', 'addto g c', 'addto h b', 'addto g b']) {
    const before = cli.dispatch('tree'); cli.dispatch(line); const after = cli.dispatch('tree');
    cli.dispatch('undo'); assert.equal(cli.dispatch('tree'), before);
    cli.dispatch('redo'); assert.equal(cli.dispatch('tree'), after);
  }
});
