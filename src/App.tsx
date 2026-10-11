import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { NodeType, PortId, Point, Selection, Workflow } from './types';
import { reducer, type State } from './reducer';
import { NODE_H, NODE_W, SURFACE_H, SURFACE_W, makeNode } from './nodeDefs';
import { connectionError, findFreeSpot } from './graph';
import { exampleWorkflow } from './example';
import { loadWorkflow, saveWorkflow } from './storage';
import { clamp, snap, uid } from './utils';
import { Palette } from './components/Palette';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import { JsonPreview } from './components/JsonPreview';
import { LogoMark, TrashIcon } from './components/Icons';

interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

function init(): State {
  const wf = loadWorkflow() ?? exampleWorkflow();
  return { ...wf, selection: null };
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [toast, setToast] = useState<Toast | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const showToast = useCallback((message: string, action?: Toast['action']) => {
    setToast({ id: Date.now(), message, action });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.action ? 6000 : 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Persist (debounced so dragging doesn't hammer localStorage).
  useEffect(() => {
    const t = window.setTimeout(() => saveWorkflow({ nodes: state.nodes, edges: state.edges }), 150);
    return () => window.clearTimeout(t);
  }, [state.nodes, state.edges]);

  const select = useCallback((selection: Selection) => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && isEditable(active)) active.blur();
    dispatch({ type: 'select', selection });
  }, []);

  const deleteSelection = useCallback(() => dispatch({ type: 'deleteSelection' }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditable(e.target) && stateRef.current.selection) {
        e.preventDefault();
        dispatch({ type: 'deleteSelection' });
      }
      if (e.key === 'Escape' && !isEditable(e.target)) dispatch({ type: 'select', selection: null });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const addNode = useCallback((type: NodeType, position: Point) => {
    dispatch({ type: 'add', node: makeNode(type, position) });
  }, []);

  const quickAdd = useCallback(
    (type: NodeType) => {
      const sc = scrollRef.current;
      const origin = { x: snap((sc?.scrollLeft ?? 0) + 32), y: snap((sc?.scrollTop ?? 0) + 32) };
      addNode(type, findFreeSpot(stateRef.current.nodes, origin, SURFACE_W, SURFACE_H));
    },
    [addNode],
  );

  const dropAt = useCallback(
    (type: NodeType, clientX: number, clientY: number) => {
      const scroll = scrollRef.current?.getBoundingClientRect();
      const surface = surfaceRef.current?.getBoundingClientRect();
      if (!scroll || !surface) return;
      const inside =
        clientX >= scroll.left && clientX <= scroll.right && clientY >= scroll.top && clientY <= scroll.bottom;
      if (!inside) {
        showToast('Drop the node onto the canvas.');
        return;
      }
      addNode(type, {
        x: clamp(snap(clientX - surface.left - NODE_W / 2), 0, SURFACE_W - NODE_W),
        y: clamp(snap(clientY - surface.top - NODE_H / 2), 0, SURFACE_H - NODE_H),
      });
    },
    [addNode, showToast],
  );

  const moveNode = useCallback((id: string, position: Point) => dispatch({ type: 'move', id, position }), []);

  const connect = useCallback(
    (from: string, port: PortId, to: string) => {
      const { nodes, edges } = stateRef.current;
      const err = connectionError({ nodes, edges }, from, port, to);
      if (err) {
        showToast(err);
        return;
      }
      dispatch({ type: 'connect', edge: { id: uid('e'), from, port, to } });
    },
    [showToast],
  );

  const replaceWorkflow = useCallback(
    (next: Workflow, message: string) => {
      const prev: Workflow = { nodes: stateRef.current.nodes, edges: stateRef.current.edges };
      dispatch({ type: 'load', workflow: next });
      showToast(message, {
        label: 'Undo',
        run: () => {
          dispatch({ type: 'load', workflow: prev });
          setToast(null);
        },
      });
    },
    [showToast],
  );

  const sel = state.selection;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <LogoMark />
          <div>
            <h1>Workflow Canvas</h1>
            <span>Visual workflow builder</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="stat" data-testid="stats">
            {state.nodes.length} {state.nodes.length === 1 ? 'node' : 'nodes'} · {state.edges.length}{' '}
            {state.edges.length === 1 ? 'connection' : 'connections'}
          </span>
          <button
            type="button"
            className="btn"
            data-testid="load-example"
            onClick={() => replaceWorkflow(exampleWorkflow(), 'Example workflow loaded.')}
          >
            Load example
          </button>
          <button
            type="button"
            className="btn"
            data-testid="clear"
            disabled={state.nodes.length === 0}
            onClick={() => replaceWorkflow({ nodes: [], edges: [] }, 'Canvas cleared.')}
          >
            Clear
          </button>
        </div>
      </header>

      <main className="workspace">
        <Palette onQuickAdd={quickAdd} onDropAt={dropAt} />
        <section className="canvas-col" aria-label="Canvas">
          <Canvas
            nodes={state.nodes}
            edges={state.edges}
            selection={sel}
            scrollRef={scrollRef}
            surfaceRef={surfaceRef}
            onSelect={select}
            onMoveNode={moveNode}
            onConnect={connect}
          />
          <div className="canvas-tools">
            <button
              type="button"
              className="btn btn-sm btn-danger"
              data-testid="delete-selected"
              disabled={!sel}
              onClick={deleteSelection}
            >
              <TrashIcon />
              Delete {sel?.kind === 'edge' ? 'connection' : 'selected'}
            </button>
          </div>
        </section>
        <div className="right-col">
          <Inspector
            selection={sel}
            nodes={state.nodes}
            edges={state.edges}
            onLabel={(id, label) => dispatch({ type: 'label', id, label })}
            onConfig={(id, key, value) => dispatch({ type: 'config', id, key, value })}
            onDelete={deleteSelection}
          />
          <JsonPreview workflow={state} />
        </div>
      </main>

      {toast && (
        <div className="toast" role="status" key={toast.id} data-testid="toast">
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" onClick={toast.action.run}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
