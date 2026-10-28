import { CliApplication } from './cli/CliApplication.js';
import { CommandDispatcher } from './cli/CommandDispatcher.js';
import { SvgFileStore } from './infrastructure/SvgFileStore.js';
import { EditorSession } from './application/EditorSession.js';

new CliApplication(new CommandDispatcher(new EditorSession(new SvgFileStore()))).run();
