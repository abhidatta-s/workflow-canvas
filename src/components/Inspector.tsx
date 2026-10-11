import type { Selection, WFEdge, WFNode } from '../types';
import { NODE_DEFS, type FieldDef } from '../nodeDefs';
import { NodeIcon, TrashIcon } from './Icons';

interface Props {
  selection: Selection;
  nodes: WFNode[];
  edges: WFEdge[];
  onLabel: (id: string, label: string) => void;
  onConfig: (id: string, key: string, value: string | number) => void;
  onDelete: () => void;
}

function Field({
  def,
  value,
  id,
  onChange,
}: {
  def: FieldDef;
  value: string | number | undefined;
  id: string;
  onChange: (v: string | number) => void;
}) {
  const v = value ?? '';
  return (
    <div className="field">
      <label htmlFor={id}>{def.label}</label>
      {def.kind === 'select' && (
        <select id={id} value={String(v)} onChange={(e) => onChange(e.target.value)}>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {def.kind === 'text' && (
        <input
          id={id}
          type="text"
          value={String(v)}
          placeholder={def.placeholder}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {def.kind === 'textarea' && (
        <textarea
          id={id}
          rows={3}
          value={String(v)}
          placeholder={def.placeholder}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {def.kind === 'number' && (
        <input
          id={id}
          type="number"
          min={0}
          value={String(v)}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )}
      {def.hint && <small>{def.hint}</small>}
    </div>
  );
}

export function Inspector({ selection, nodes, edges, onLabel, onConfig, onDelete }: Props) {
  const node = selection?.kind === 'node' ? nodes.find((n) => n.id === selection.id) : undefined;
  const edge = selection?.kind === 'edge' ? edges.find((e) => e.id === selection.id) : undefined;

  let body: React.ReactNode;
  if (node) {
    const def = NODE_DEFS[node.type];
    body = (
      <>
        <div className={`inspector-title t-${node.type}`}>
          <span className="node-icon">
            <NodeIcon type={node.type} />
          </span>
          <div>
            <strong>{def.title}</strong>
            <small className="mono">{node.id}</small>
          </div>
          <button type="button" className="btn btn-icon btn-danger" onClick={onDelete} title="Delete node" aria-label="Delete node">
            <TrashIcon />
          </button>
        </div>
        <div className="field">
          <label htmlFor="f-label">Label</label>
          <input
            id="f-label"
            type="text"
            value={node.label}
            onChange={(e) => onLabel(node.id, e.target.value)}
          />
        </div>
        {def.fields(node.config).map((f) => (
          <Field
            key={`${node.id}-${f.key}`}
            id={`f-${f.key}`}
            def={f}
            value={node.config[f.key]}
            onChange={(v) => onConfig(node.id, f.key, v)}
          />
        ))}
      </>
    );
  } else if (edge) {
    const from = nodes.find((n) => n.id === edge.from);
    const to = nodes.find((n) => n.id === edge.to);
    body = (
      <>
        <div className="inspector-title">
          <div>
            <strong>Connection</strong>
            <small className="mono">{edge.id}</small>
          </div>
          <button type="button" className="btn btn-icon btn-danger" onClick={onDelete} title="Delete connection" aria-label="Delete connection">
            <TrashIcon />
          </button>
        </div>
        <dl className="edge-info">
          <dt>From</dt>
          <dd>
            {from?.label ?? edge.from}
            {edge.port !== 'out' && <span className={`pill pill-${edge.port}`}>{edge.port}</span>}
          </dd>
          <dt>To</dt>
          <dd>{to?.label ?? edge.to}</dd>
        </dl>
      </>
    );
  } else {
    body = (
      <div className="inspector-empty">
        <strong>Nothing selected</strong>
        <span>Click a node to edit its label and settings, or click a connection to inspect or remove it.</span>
      </div>
    );
  }

  return (
    <section className="panel inspector" aria-label="Inspector">
      <div className="panel-head">
        <h2>Inspector</h2>
      </div>
      <div className="inspector-body">{body}</div>
    </section>
  );
}
