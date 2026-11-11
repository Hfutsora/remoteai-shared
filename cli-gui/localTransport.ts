import { invoke } from '../platform/localBackend';
import { subscribeGuiEvent } from '../conversation/webEvents';
import { CLI_GUI_EVENT, type CliTransport } from './types';

export const localCliTransport: CliTransport = {
  request: request => invoke('cli_gui_request', { request }),
  subscribeAccountChange: listener => subscribeGuiEvent('codex-gui-account-changed', listener),
  subscribe: listener => subscribeGuiEvent<{ method: string }>('codex-gui-event', event => {
    if (event.method === CLI_GUI_EVENT) listener();
  }),
};
