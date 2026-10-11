import type { PortId, WFEdge, WFNode, Workflow, Point } from './types';
import { NODE_DEFS, NODE_H, NODE_W } from './nodeDefs';

function reachable(edges: WFEdge[], start: string, target: string): boolean {
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop() as string;
    if (cur === target) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const e of edges) if (e.from === cur) stack.push(e.to);
  }
  return false;
}

/** Returns a human-readable reason if the connection is not allowed, otherwise null. */
export function connectionError(wf: Workflow, from: string, port: PortId, to: string): string | null {
  const src = wf.nodes.find((n) => n.id === from);
  const dst = wf.nodes.find((n) => n.id === to);
  if (!src || !dst) return 'Could not find that node.';
  if (from === to) return 'A node cannot connect to itself.';
  if (!NODE_DEFS[dst.type].hasInput) return 'Triggers have no input; they only start a workflow.';
  if (!NODE_DEFS[src.type].ports.includes(port)) return 'That output does not exist.';
  if (wf.edges.some((e) => e.from === from && e.port === port && e.to === to)) return 'Already connected.';
  if (reachable(wf.edges, to, from)) return 'That connection would create a loop.';
  return null;
}

export function validateWorkflow(wf: Workflow): string[] {
  const out: string[] = [];
  if (wf.nodes.length === 0) return out;
  if (!wf.nodes.some((n) => n.type === 'trigger')) out.push('Add a Trigger to start the workflow.');
  for (const n of wf.nodes) {
    const def = NODE_DEFS[n.type];
    if (def.hasInput && !wf.edges.some((e) => e.to === n.id)) {
      out.push(`"${n.label}" has no incoming connection.`);
    }
    for (const p of def.ports) {
      if (n.type === 'condition' && !wf.edges.some((e) => e.from === n.id && e.port === p)) {
        out.push(`"${n.label}" has no "${p}" branch connected.`);
      }
    }
  }
  return out;
}

export function findFreeSpot(nodes: WFNode[], origin: Point, maxX: number, maxY: number): Point {
  const stepX = NODE_W + 40;
  const stepY = NODE_H + 28;
  for (let y = origin.y; y < maxY - NODE_H; y += stepY) {
    for (let x = origin.x; x < maxX - NODE_W; x += stepX) {
      const clash = nodes.some(
        (n) =>
          Math.abs(n.position.x - x) < NODE_W + 12 && Math.abs(n.position.y - y) < NODE_H + 12,
      );
      if (!clash) return { x, y };
    }
  }
  return origin;
}

export function buildWorkflowJson(wf: Workflow): string {
  return JSON.stringify(
    {
      version: 1,
      nodes: wf.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        config: n.config,
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      })),
      edges: wf.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, port: e.port })),
    },
    null,
    2,
  );
}
