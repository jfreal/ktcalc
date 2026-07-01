import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import 'src/components/RuleDocPage.css';

interface RuleDocPageProps {
  // Markdown file name in public/rules/ (generated from rules/ by copy-rules.js).
  file: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ok'; text: string }
  | { status: 'error'; message: string };

const RuleDocPage: React.FC<RuleDocPageProps> = ({ file }) => {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    // Reset to loading so a file change never leaves stale content on screen.
    setState({ status: 'loading' });
    const controller = new AbortController();
    const url = `${process.env.PUBLIC_URL || ''}/rules/${file}`;
    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => setState({ status: 'ok', text }))
      .catch((e) => {
        if (e.name === 'AbortError') return; // superseded/unmounted — ignore
        setState({ status: 'error', message: String(e) });
      });
    return () => controller.abort();
  }, [file]);

  return (
    <Container className="RuleDoc">
      <p>
        <Link to="/help">&larr; Back to How it works</Link>
      </p>

      {state.status === 'loading' && <p className="RuleDoc-status">Loading&hellip;</p>}
      {state.status === 'error' && (
        <p className="RuleDoc-status RuleDoc-error">Could not load this document ({state.message}).</p>
      )}
      {state.status === 'ok' && (
        <div className="RuleDoc-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
        </div>
      )}

      <p className="RuleDoc-backBottom">
        <Link to="/help">&larr; Back to How it works</Link>
      </p>
    </Container>
  );
};

export default RuleDocPage;
