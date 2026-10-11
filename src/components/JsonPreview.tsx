import { useEffect, useMemo, useRef, useState } from 'react';
import type { Workflow } from '../types';
import { buildWorkflowJson, validateWorkflow } from '../graph';
import { copyText } from '../utils';
import { CopyIcon } from './Icons';

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function highlight(json: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of json.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(json.slice(last, idx));
    const [full, str, colon] = m;
    let cls = 'tok-num';
    if (str !== undefined) cls = colon ? 'tok-key' : 'tok-str';
    else if (/^(true|false|null)$/.test(full)) cls = 'tok-lit';
    if (colon && str !== undefined) {
      out.push(
        <span key={i++} className="tok-key">
          {str}
        </span>,
        colon,
      );
    } else {
      out.push(
        <span key={i++} className={cls}>
          {full}
        </span>,
      );
    }
    last = idx + full.length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

export function JsonPreview({ workflow }: { workflow: Workflow }) {
  const json = useMemo(() => buildWorkflowJson(workflow), [workflow.nodes, workflow.edges]); // eslint-disable-line react-hooks/exhaustive-deps
  const warnings = useMemo(() => validateWorkflow(workflow), [workflow.nodes, workflow.edges]); // eslint-disable-line react-hooks/exhaustive-deps
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    const ok = await copyText(json);
    setStatus(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 1800);
  }

  return (
    <section className="panel json-panel" aria-label="JSON preview">
      <div className="panel-head">
        <h2>Workflow JSON</h2>
        <button type="button" className="btn btn-sm" onClick={copy} data-testid="copy-json">
          <CopyIcon />
          {status === 'copied' ? 'Copied!' : status === 'failed' ? 'Copy failed' : 'Copy'}
        </button>
      </div>
      <pre className="json-code" data-testid="json-output" tabIndex={0}>
        <code>{highlight(json)}</code>
      </pre>
      <div className="json-foot" data-testid="validation">
        {workflow.nodes.length === 0 ? (
          <span className="muted">Empty workflow</span>
        ) : warnings.length === 0 ? (
          <span className="ok">● Looks good: all nodes are connected</span>
        ) : (
          <ul>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
