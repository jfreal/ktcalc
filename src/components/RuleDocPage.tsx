import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import 'src/components/RuleDocPage.css';
import Seo from 'src/components/Seo';
import * as T from 'src/theme';

// SEO copy per rules doc, keyed by the same file name the route passes in, so the
// <head> for each /rules/* page matches the document it renders.
const DOC_SEO: Record<string, { title: string; description: string; path: string }> = {
  'COMBAT_RULES.md': {
    title: 'Kill Team 2024 Combat & Save Rules | ktcalc',
    description:
      'How ktcalc resolves Kill Team 2024 saves: defense dice, cover, Feel No Pain, Piercing, and Saintly Relics — the combat rules the shoot calculator is validated against.',
    path: '/rules/combat/',
  },
  'FIGHT_RULES.md': {
    title: 'Kill Team 2024 Fight Rules — Melee Resolution | ktcalc',
    description:
      'How ktcalc models Kill Team 2024 melee: the alternating strike/parry sequence, what a parry cancels, the engine’s strike-vs-parry logic, and hand-verifiable scenarios.',
    path: '/rules/fight/',
  },
  'WEAPON_RULES.md': {
    title: 'Kill Team 2024 Weapon Rules Reference | ktcalc',
    description:
      'Reference for every Kill Team 2024 weapon rule ktcalc supports — Accurate, Balanced, Brutal, Ceaseless, Devastating, Lethal, Piercing, Relentless, Rending and more.',
    path: '/rules/weapon/',
  },
};

// Plain CSS can't import theme.ts, so the handful of theme colors this
// stylesheet needs are threaded in as custom properties instead of being
// hardcoded a second time in RuleDocPage.css.
const themeVars: React.CSSProperties = {
  ['--rule-doc-zebra-odd' as any]: T.zebraOdd,
  ['--rule-doc-accent' as any]: T.accent,
  ['--rule-doc-text-muted' as any]: T.textMuted,
  ['--rule-doc-border-faint' as any]: T.borderFaint,
  ['--rule-doc-error' as any]: T.error,
};

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

  // Fall back to a generic rules-reference head for any unknown file so a new or
  // mistyped doc never leaves the previous route's title/canonical/meta in place
  // on client-side navigation.
  const seo = DOC_SEO[file] ?? {
    title: 'Kill Team 2024 Rules Reference | ktcalc',
    description: 'Kill Team 2024 rules reference for the ktcalc shooting and fighting calculator.',
    path: '/help/',
  };

  return (
    <Container className="RuleDoc" style={themeVars}>
      <Seo title={seo.title} description={seo.description} path={seo.path} />
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
