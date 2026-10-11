import type { NodeConfig, NodeType, PortId, Point, WFNode } from './types';
import { uid } from './utils';

export const NODE_W = 160;
export const NODE_H = 76;
export const SURFACE_W = 2400;
export const SURFACE_H = 1600;

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'number' | 'select';
  options?: FieldOption[];
  placeholder?: string;
  hint?: string;
}

export interface NodeDef {
  type: NodeType;
  title: string;
  description: string;
  defaultLabel: string;
  ports: PortId[];
  hasInput: boolean;
  defaultConfig: () => NodeConfig;
  fields: (config: NodeConfig) => FieldDef[];
  summary: (config: NodeConfig) => string;
}

export const TRIGGER_EVENTS: FieldOption[] = [
  { value: 'webhook', label: 'Webhook received' },
  { value: 'schedule', label: 'On a schedule' },
  { value: 'form_submitted', label: 'Form submitted' },
  { value: 'record_created', label: 'Record created' },
  { value: 'manual', label: 'Manual run' },
];

export const DELAY_UNITS: FieldOption[] = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

interface ActionTypeDef {
  value: string;
  label: string;
  params: FieldDef[];
}

export const ACTION_TYPES: ActionTypeDef[] = [
  {
    value: 'send_email',
    label: 'Send email',
    params: [
      { key: 'to', label: 'To', kind: 'text', placeholder: 'team@example.com' },
      { key: 'subject', label: 'Subject', kind: 'text', placeholder: 'Subject line' },
    ],
  },
  {
    value: 'slack_message',
    label: 'Post Slack message',
    params: [
      { key: 'channel', label: 'Channel', kind: 'text', placeholder: '#general' },
      { key: 'message', label: 'Message', kind: 'textarea', placeholder: 'What should it say?' },
    ],
  },
  {
    value: 'http_request',
    label: 'HTTP request',
    params: [
      {
        key: 'method',
        label: 'Method',
        kind: 'select',
        options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ value: m, label: m })),
      },
      { key: 'url', label: 'URL', kind: 'text', placeholder: 'https://api.example.com/hook' },
    ],
  },
  {
    value: 'create_record',
    label: 'Create record',
    params: [
      { key: 'table', label: 'Table', kind: 'text', placeholder: 'tickets' },
      { key: 'data', label: 'Data (JSON)', kind: 'textarea', placeholder: '{ "status": "open" }' },
    ],
  },
  {
    value: 'run_script',
    label: 'Run script',
    params: [{ key: 'script', label: 'Script', kind: 'textarea', placeholder: 'return payload;' }],
  },
];

function actionDef(value: string): ActionTypeDef {
  return ACTION_TYPES.find((a) => a.value === value) ?? (ACTION_TYPES[0] as ActionTypeDef);
}

function paramDefaults(value: string): NodeConfig {
  const out: NodeConfig = {};
  for (const p of actionDef(value).params) {
    out[p.key] = p.kind === 'select' ? (p.options?.[0]?.value ?? '') : '';
  }
  return out;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' || typeof v === 'number' ? String(v) : fallback;
}

export const NODE_DEFS: Record<NodeType, NodeDef> = {
  trigger: {
    type: 'trigger',
    title: 'Trigger',
    description: 'Starts the workflow',
    defaultLabel: 'New trigger',
    ports: ['out'],
    hasInput: false,
    defaultConfig: () => ({ event: 'webhook' }),
    fields: (c) => {
      const fields: FieldDef[] = [
        { key: 'event', label: 'Event type', kind: 'select', options: TRIGGER_EVENTS },
      ];
      if (c.event === 'schedule') {
        fields.push({
          key: 'cron',
          label: 'Cron expression',
          kind: 'text',
          placeholder: '0 9 * * 1-5',
          hint: 'Minute, hour, day, month, weekday',
        });
      }
      return fields;
    },
    summary: (c) => TRIGGER_EVENTS.find((e) => e.value === c.event)?.label ?? str(c.event, 'No event'),
  },
  condition: {
    type: 'condition',
    title: 'Condition',
    description: 'Branch on true / false',
    defaultLabel: 'New condition',
    ports: ['true', 'false'],
    hasInput: true,
    defaultConfig: () => ({ expression: 'payload.value > 0' }),
    fields: () => [
      {
        key: 'expression',
        label: 'Expression',
        kind: 'textarea',
        placeholder: 'payload.priority == "urgent"',
        hint: 'Evaluated against the incoming payload',
      },
    ],
    summary: (c) => str(c.expression, 'No expression'),
  },
  action: {
    type: 'action',
    title: 'Action',
    description: 'Do something',
    defaultLabel: 'New action',
    ports: ['out'],
    hasInput: true,
    defaultConfig: () => ({ actionType: 'send_email', ...paramDefaults('send_email') }),
    fields: (c) => [
      {
        key: 'actionType',
        label: 'Action type',
        kind: 'select',
        options: ACTION_TYPES.map((a) => ({ value: a.value, label: a.label })),
      },
      ...actionDef(str(c.actionType)).params,
    ],
    summary: (c) => actionDef(str(c.actionType)).label,
  },
  delay: {
    type: 'delay',
    title: 'Delay',
    description: 'Wait before continuing',
    defaultLabel: 'New delay',
    ports: ['out'],
    hasInput: true,
    defaultConfig: () => ({ duration: 5, unit: 'minutes' }),
    fields: () => [
      { key: 'duration', label: 'Duration', kind: 'number' },
      { key: 'unit', label: 'Unit', kind: 'select', options: DELAY_UNITS },
    ],
    summary: (c) => {
      const d = c.duration === '' || c.duration === undefined ? '?' : str(c.duration);
      return `Wait ${d} ${str(c.unit, 'minutes')}`;
    },
  },
};

export const NODE_TYPES: NodeType[] = ['trigger', 'condition', 'action', 'delay'];

/** Apply a config edit, resetting dependent keys when the discriminating field changes. */
export function changeConfig(
  type: NodeType,
  config: NodeConfig,
  key: string,
  value: string | number,
): NodeConfig {
  if (type === 'action' && key === 'actionType') {
    return { actionType: String(value), ...paramDefaults(String(value)) };
  }
  if (type === 'trigger' && key === 'event') {
    return value === 'schedule' ? { event: 'schedule', cron: '0 9 * * 1-5' } : { event: String(value) };
  }
  return { ...config, [key]: value };
}

export function makeNode(type: NodeType, position: Point): WFNode {
  const def = NODE_DEFS[type];
  return { id: uid('n'), type, label: def.defaultLabel, config: def.defaultConfig(), position };
}

const PORT_FRACTION: Record<PortId, number> = { out: 0.5, true: 0.32, false: 0.68 };

export function portFraction(port: PortId): number {
  return PORT_FRACTION[port];
}

export function outPortPos(node: WFNode, port: PortId): Point {
  return { x: node.position.x + NODE_W, y: node.position.y + NODE_H * PORT_FRACTION[port] };
}

export function inPortPos(node: WFNode): Point {
  return { x: node.position.x, y: node.position.y + NODE_H / 2 };
}
