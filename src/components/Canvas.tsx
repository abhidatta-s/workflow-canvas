import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { PortId, Point, Selection, WFEdge, WFNode } from '../types';
import {
  NODE_DEFS,
  NODE_H,
  NODE_W,
  SURFACE_H,
  SURFACE_W,
  inPortPos,
  outPortPos,
  portFraction,
} from '../nodeDefs';
import { clamp, snap } from '../utils';
import { NodeIcon } from './Icons';

interface CanvasProps {
  nodes: WFNode[];
  edges: WFEdge[];
  selection: Selection;
  scrollRef: React.RefObject<HTMLDivElement>;
  surfaceRef: React.RefObject<HTMLDivElement>;
  onSelect: (s: Selection) => void;
  onMoveNode: (id: string, p: Point) => void;
  onConnect: (from: string, port: PortId, to: string) => void;
}

interface Connecting {
  from: string;
  port: PortId;
  pointer: Point;
  hoverId: string | null;
}

function curve(a: Point, b: Point): string {
  // Forward edges use half the horizontal gap so the control points never cross.
  const gap = b.x - a.x;
  const dx = gap > 0 ? gap * 0.5 : Math.max(48, Math.abs(gap) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

export function Canvas({
  nodes,
  edges,
  selection,
  scrollRef,
  surfaceRef,
  onSelect,
  onMoveNode,
  onConnect,
}: CanvasProps) {
  const [connecting, setConnecting] = useState<Connecting | null>(null);
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const connectRef = useRef(connecting);
  connectRef.current = connecting;

  function toCanvas(clientX: number, clientY: number): Point {
    const r = surfaceRef.current?.getBoundingClientRect();
    return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) };
  }

  const isConnecting = connecting !== null;
  useEffect(() => {
    if (!isConnecting) return;
    const hit = (x: number, y: number): string | null => {
      const el = document.elementFromPoint(x, y);
      const nodeEl = el?.closest<HTMLElement>('[data-node-id]');
      return nodeEl?.dataset.nodeId ?? null;
    };
    const move = (e: PointerEvent) => {
      setConnecting((c) =>
        c ? { ...c, pointer: toCanvas(e.clientX, e.clientY), hoverId: hit(e.clientX, e.clientY) } : c,
      );
    };
    const finish = (e: PointerEvent, cancelled: boolean) => {
      const c = connectRef.current;
      setConnecting(null);
      if (!c || cancelled) return;
      const target = hit(e.clientX, e.clientY);
      if (target) onConnect(c.from, c.port, target);
    };
    const up = (e: PointerEvent) => finish(e, false);
    const cancel = (e: PointerEvent) => finish(e, true);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnecting, onConnect]);

  function startConnect(nodeId: string, port: PortId, e: React.PointerEvent) {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect({ kind: 'node', id: nodeId });
    setConnecting({
      from: nodeId,
      port,
      pointer: toCanvas(e.clientX, e.clientY),
      hoverId: null,
    });
  }

  const selectedNodeId = selection?.kind === 'node' ? selection.id : null;
  const selectedEdgeId = selection?.kind === 'edge' ? selection.id : null;

  return (
    <div className="canvas-wrap">
      <div
        className="canvas-scroll"
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label="Workflow canvas (scrollable)"
        data-testid="canvas-scroll"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget || e.target === surfaceRef.current) onSelect(null);
        }}
      >
        <div
          className={`canvas-surface${isConnecting ? ' is-connecting' : ''}`}
          ref={surfaceRef}
          data-testid="canvas-surface"
          style={{ width: SURFACE_W, height: SURFACE_H }}
        >
          <svg className="edges" width={SURFACE_W} height={SURFACE_H} aria-hidden="true">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#5b6479" />
              </marker>
              <marker id="arrow-sel" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#9aa6ff" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const src = nodeMap.get(edge.from);
              const dst = nodeMap.get(edge.to);
              if (!src || !dst) return null;
              const a = outPortPos(src, edge.port);
              const b = inPortPos(dst);
              const selected = edge.id === selectedEdgeId;
              const d = curve(a, b);
              const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
              return (
                <g
                  key={edge.id}
                  className={`edge${selected ? ' is-selected' : ''} via-${edge.port}`}
                  data-edge-id={edge.id}
                >
                  <path className="edge-line" d={d} markerEnd={selected ? 'url(#arrow-sel)' : 'url(#arrow)'} />
                  <path
                    className="edge-hit"
                    d={d}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSelect({ kind: 'edge', id: edge.id });
                    }}
                  />
                  {edge.port !== 'out' && (
                    <g className="edge-badge" transform={`translate(${mid.x} ${mid.y})`}>
                      <rect x="-17" y="-9" width="34" height="18" rx="9" />
                      <text textAnchor="middle" dominantBaseline="central">
                        {edge.port}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {connecting && nodeMap.get(connecting.from) && (
              <path
                className="edge-temp"
                d={curve(outPortPos(nodeMap.get(connecting.from) as WFNode, connecting.port), connecting.pointer)}
              />
            )}
          </svg>
          {nodes.map((node) => (
            <NodeView
              key={node.id}
              node={node}
              selected={node.id === selectedNodeId}
              dropTarget={connecting !== null && connecting.hoverId === node.id && connecting.from !== node.id}
              onSelect={onSelect}
              onMove={onMoveNode}
              onStartConnect={startConnect}
            />
          ))}
        </div>
      </div>
      {nodes.length === 0 && (
        <div className="canvas-empty">
          <strong>Your canvas is empty</strong>
          <span>Drag a node in from the palette, or load the example from the toolbar.</span>
        </div>
      )}
    </div>
  );
}

interface NodeViewProps {
  node: WFNode;
  selected: boolean;
  dropTarget: boolean;
  onSelect: (s: Selection) => void;
  onMove: (id: string, p: Point) => void;
  onStartConnect: (nodeId: string, port: PortId, e: React.PointerEvent) => void;
}

const NodeView = memo(function NodeView({
  node,
  selected,
  dropTarget,
  onSelect,
  onMove,
  onStartConnect,
}: NodeViewProps) {
  const def = NODE_DEFS[node.type];
  const [dragging, setDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect({ kind: 'node', id: node.id });
    const start = { x: e.clientX, y: e.clientY };
    const origin = node.position;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      onMove(node.id, {
        x: clamp(snap(origin.x + ev.clientX - start.x), 0, SURFACE_W - NODE_W),
        y: clamp(snap(origin.y + ev.clientY - start.y), 0, SURFACE_H - NODE_H),
      });
    };
    const stop = (ev: PointerEvent) => {
      if (ev.type === 'pointerup') move(ev); // apply the final position even if the last move was coalesced
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }

  const cls = ['node', `t-${node.type}`, selected && 'is-selected', dragging && 'is-dragging', dropTarget && 'is-drop-target']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      data-node-id={node.id}
      data-node-type={node.type}
      style={{ left: node.position.x, top: node.position.y, width: NODE_W, height: NODE_H }}
      onPointerDown={onPointerDown}
    >
      <div className="node-head">
        <span className="node-icon">
          <NodeIcon type={node.type} />
        </span>
        <span className="node-type">{def.title}</span>
      </div>
      <div className="node-label" title={node.label}>
        {node.label || 'Untitled'}
      </div>
      <div className="node-summary" title={def.summary(node.config)}>
        {def.summary(node.config)}
      </div>
      {def.hasInput && <span className="port port-in" data-in-port={node.id} title="Input" />}
      {def.ports.map((p) => (
        <span
          key={p}
          className={`port port-out port-${p}`}
          data-out-port={p}
          style={{ top: `${portFraction(p) * 100}%` }}
          title={p === 'out' ? 'Drag to connect' : `Drag to connect the "${p}" branch`}
          onPointerDown={(e) => onStartConnect(node.id, p, e)}
        >
          {p !== 'out' && <em>{p === 'true' ? 'T' : 'F'}</em>}
        </span>
      ))}
    </div>
  );
});
