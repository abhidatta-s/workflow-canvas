import type { NodeConfig, NodeType, PortId, Workflow } from './types';

const KEY = 'workflow-canvas:v1';
const NODE_TYPES: string[] = ['trigger', 'condition', 'action', 'delay'];
const PORTS: string[] = ['out', 'true', 'false'];

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Defensive parse: drops anything malformed rather than crashing the app. */
export function parseWorkflow(raw: unknown): Workflow | null {
  if (!isObj(raw) || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return null;
  const nodes: Workflow['nodes'] = [];
  for (const n of raw.nodes) {
    if (!isObj(n) || typeof n.id !== 'string' || typeof n.type !== 'string') continue;
    if (!NODE_TYPES.includes(n.type)) continue;
    const pos = isObj(n.position) ? n.position : {};
    const config: NodeConfig = {};
    if (isObj(n.config)) {
      for (const [k, v] of Object.entries(n.config)) {
        if (typeof v === 'string' || typeof v === 'number') config[k] = v;
      }
    }
    nodes.push({
      id: n.id,
      type: n.type as NodeType,
      label: typeof n.label === 'string' ? n.label : 'Untitled',
      config,
      position: {
        x: typeof pos.x === 'number' ? pos.x : 0,
        y: typeof pos.y === 'number' ? pos.y : 0,
      },
    });
  }
  const ids = new Set(nodes.map((n) => n.id));
  const edges: Workflow['edges'] = [];
  for (const e of raw.edges) {
    if (!isObj(e) || typeof e.id !== 'string') continue;
    if (typeof e.from !== 'string' || typeof e.to !== 'string' || typeof e.port !== 'string') continue;
    if (!ids.has(e.from) || !ids.has(e.to) || !PORTS.includes(e.port)) continue;
    edges.push({ id: e.id, from: e.from, to: e.to, port: e.port as PortId });
  }
  return { nodes, edges };
}

export function loadWorkflow(): Workflow | null {
  try {
    const text = window.localStorage.getItem(KEY);
    if (!text) return null;
    return parseWorkflow(JSON.parse(text));
  } catch {
    return null;
  }
}

export function saveWorkflow(wf: Workflow): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(wf));
  } catch {
    /* storage unavailable (private mode / quota); the app still works in memory */
  }
}
