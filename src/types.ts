export type NodeType = 'trigger' | 'condition' | 'action' | 'delay';
export type PortId = 'out' | 'true' | 'false';
export type ConfigValue = string | number;
export type NodeConfig = Record<string, ConfigValue>;

export interface Point {
  x: number;
  y: number;
}

export interface WFNode {
  id: string;
  type: NodeType;
  label: string;
  config: NodeConfig;
  position: Point;
}

export interface WFEdge {
  id: string;
  from: string;
  port: PortId;
  to: string;
}

export interface Workflow {
  nodes: WFNode[];
  edges: WFEdge[];
}

export type Selection = { kind: 'node' | 'edge'; id: string } | null;
