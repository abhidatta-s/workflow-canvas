import { useEffect, useRef, useState } from 'react';
import type { NodeType } from '../types';
import { NODE_DEFS, NODE_TYPES } from '../nodeDefs';
import { distance } from '../utils';
import { NodeIcon } from './Icons';

interface Props {
  onQuickAdd: (type: NodeType) => void;
  onDropAt: (type: NodeType, clientX: number, clientY: number) => void;
}

interface Ghost {
  type: NodeType;
  x: number;
  y: number;
}

export function Palette({ onQuickAdd, onDropAt }: Props) {
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanup.current?.(), []);

  function onPointerDown(type: NodeType, e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let dragging = false;

    const move = (ev: PointerEvent) => {
      if (!dragging && distance(start, { x: ev.clientX, y: ev.clientY }) > 5) dragging = true;
      if (dragging) setGhost({ type, x: ev.clientX, y: ev.clientY });
    };
    const end = (ev: PointerEvent, cancelled: boolean) => {
      cleanup.current?.();
      setGhost(null);
      if (cancelled) return;
      if (dragging) onDropAt(type, ev.clientX, ev.clientY);
      else onQuickAdd(type);
    };
    const up = (ev: PointerEvent) => end(ev, false);
    const cancel = (ev: PointerEvent) => end(ev, true);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    cleanup.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      cleanup.current = null;
    };
  }

  return (
    <aside className="panel palette" aria-label="Node palette">
      <div className="panel-head">
        <h2>Nodes</h2>
      </div>
      <p className="palette-hint">Drag onto the canvas, or click to add.</p>
      <ul className="palette-list">
        {NODE_TYPES.map((type) => {
          const def = NODE_DEFS[type];
          return (
            <li key={type}>
              <button
                type="button"
                className={`palette-item t-${type}`}
                data-palette-type={type}
                onPointerDown={(e) => onPointerDown(type, e)}
                onClick={(e) => {
                  // Keyboard activation only (detail === 0); pointer clicks are handled above.
                  if (e.detail === 0) onQuickAdd(type);
                }}
              >
                <span className="palette-icon">
                  <NodeIcon type={type} />
                </span>
                <span className="palette-text">
                  <strong>{def.title}</strong>
                  <small>{def.description}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="palette-tips">
        <h3>Shortcuts</h3>
        <dl>
          <dt>Connect</dt>
          <dd>Drag from an output dot to a node</dd>
          <dt>Edit</dt>
          <dd>Click a node</dd>
          <dt>
            <kbd>Del</kbd>
          </dt>
          <dd>Remove selection</dd>
        </dl>
      </div>
      {ghost && (
        <div className={`drag-ghost t-${ghost.type}`} style={{ left: ghost.x, top: ghost.y }}>
          <NodeIcon type={ghost.type} />
          <span>{NODE_DEFS[ghost.type].title}</span>
        </div>
      )}
    </aside>
  );
}
