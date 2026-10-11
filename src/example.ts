import type { Workflow } from './types';

export function exampleWorkflow(): Workflow {
  return {
    nodes: [
      {
        id: 'n_trigger',
        type: 'trigger',
        label: 'New support ticket',
        config: { event: 'webhook' },
        position: { x: 16, y: 144 },
      },
      {
        id: 'n_urgent',
        type: 'condition',
        label: 'Is it urgent?',
        config: { expression: 'ticket.priority == "urgent"' },
        position: { x: 232, y: 144 },
      },
      {
        id: 'n_page',
        type: 'action',
        label: 'Page on-call',
        config: { actionType: 'slack_message', channel: '#on-call', message: 'Urgent ticket: {{ticket.title}}' },
        position: { x: 448, y: 48 },
      },
      {
        id: 'n_wait',
        type: 'delay',
        label: 'Wait one hour',
        config: { duration: 1, unit: 'hours' },
        position: { x: 448, y: 248 },
      },
      {
        id: 'n_email',
        type: 'action',
        label: 'Email the customer',
        config: { actionType: 'send_email', to: '{{ticket.email}}', subject: 'We got your request' },
        position: { x: 664, y: 248 },
      },
    ],
    edges: [
      { id: 'e_1', from: 'n_trigger', port: 'out', to: 'n_urgent' },
      { id: 'e_2', from: 'n_urgent', port: 'true', to: 'n_page' },
      { id: 'e_3', from: 'n_urgent', port: 'false', to: 'n_wait' },
      { id: 'e_4', from: 'n_wait', port: 'out', to: 'n_email' },
    ],
  };
}
