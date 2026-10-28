import { CliApplication } from './cli/CliApplication.js';
import { CommandDispatcher } from './cli/CommandDispatcher.js';
import { EditorSession } from './application/EditorSession.js';

new CliApplication(new CommandDispatcher(new EditorSession())).run();
