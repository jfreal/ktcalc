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
    let cancelled = false;
    const url = `${process.env.PUBLIC_URL || ''}/rules/${file}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setState({ status: 'ok', text });
      })
      .catch((e) => {
        if (!cancelled) setState({ status: 'error', message: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <Container style={{ maxWidth: '820px', padding: '24px 16px', fontSize: '14px', lineHeight: 1.55 }}>
      <p>
        <Link to="/help">&larr; Back to How it works</Link>
      </p>

      {state.status === 'loading' && <p>Loading&hellip;</p>}
      {state.status === 'error' && (
        <p style={{ color: '#b00020' }}>Could not load this document ({state.message}).</p>
      )}
      {state.status === 'ok' && (
        <div className="RuleDoc-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
        </div>
      )}

      <p style={{ marginTop: '24px' }}>
        <Link to="/help">&larr; Back to How it works</Link>
      </p>
    </Container>
  );
};

export default RuleDocPage;
