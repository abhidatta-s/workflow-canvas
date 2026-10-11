import type { NodeConfig, Point, Selection, WFEdge, WFNode, Workflow } from './types';
import { changeConfig } from './nodeDefs';

export interface State extends Workflow {
  selection: Selection;
}

export type Action =
  | { type: 'add'; node: WFNode }
  | { type: 'move'; id: string; position: Point }
  | { type: 'label'; id: string; label: string }
  | { type: 'config'; id: string; key: string; value: string | number }
  | { type: 'connect'; edge: WFEdge }
  | { type: 'select'; selection: Selection }
  | { type: 'deleteSelection' }
  | { type: 'load'; workflow: Workflow };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        nodes: [...state.nodes, action.node],
        selection: { kind: 'node', id: action.node.id },
      };
    case 'move': {
      const node = state.nodes.find((n) => n.id === action.id);
      if (!node || (node.position.x === action.position.x && node.position.y === action.position.y)) {
        return state;
      }
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, position: action.position } : n)),
      };
    }
    case 'label':
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, label: action.label } : n)),
      };
    case 'config':
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          if (n.id !== action.id) return n;
          const config: NodeConfig = changeConfig(n.type, n.config, action.key, action.value);
          return { ...n, config };
        }),
      };
    case 'connect':
      // One edge per output port: connecting again replaces the previous target.
      return {
        ...state,
        edges: [
          ...state.edges.filter((e) => !(e.from === action.edge.from && e.port === action.edge.port)),
          action.edge,
        ],
        selection: { kind: 'edge', id: action.edge.id },
      };
    case 'select':
      return { ...state, selection: action.selection };
    case 'deleteSelection': {
      const sel = state.selection;
      if (!sel) return state;
      if (sel.kind === 'edge') {
        return { ...state, edges: state.edges.filter((e) => e.id !== sel.id), selection: null };
      }
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== sel.id),
        edges: state.edges.filter((e) => e.from !== sel.id && e.to !== sel.id),
        selection: null,
      };
    }
    case 'load':
      return { ...action.workflow, selection: null };
  }
}
