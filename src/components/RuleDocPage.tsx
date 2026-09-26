import React, { useEffect, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import 'src/components/RuleDocPage.css';
import { HeadingSlugger } from 'src/components/headingSlug';
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
  'COVER_SAVES.md': {
    title: 'When Not to Take Cover Saves in Kill Team 2024 | ktcalc',
    description:
      'Cover saves are optional. Measured guidance on the rare matchups where declining cover is correct \u2014 save promotions against a mostly-critical attack \u2014 and why ktcalc always takes them.',
    path: '/rules/cover-saves/',
  },
  'WEAPON_BALANCE.md': {
    title: 'Comparing Kill Team 2024 Weapons by Power Level | ktcalc',
    description:
      'Measured comparison of KT24 melee and heavy weapon profiles against a fixed slate of targets, plain and buffed, with the sets that come out balanced and what the model leaves out.',
    path: '/rules/weapon-balance/',
  },
  'RETAINED_VS_MODIFIED_DICE.md': {
    title: 'Retained vs Modified Dice in Kill Team 2024 | ktcalc',
    description:
      'A dice can only be retained once. Why Rending cannot promote a cover save but Severe can, which Kill Team 2024 rules lock a dice, and how ktcalc models the difference.',
    path: '/rules/retained-vs-modified/',
  },
};

// Markdown links to other in-app pages ("/rules/...") must go through react-router,
// otherwise clicking one triggers a full page reload out of the SPA. External links
// (and anchors) stay plain <a>, and get the usual new-tab safety attributes.
export function MarkdownLink({ href, children }: React.ComponentPropsWithoutRef<'a'>) {
  const isInternal = !!href && href.startsWith('/') && !href.startsWith('//');
  if (isInternal) {
    return <Link to={href}>{children}</Link>;
  }
  const isExternal = !!href && /^https?:/i.test(href);
  return (
    <a href={href} {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

// Visible heading text, with inline markup (emphasis, code) flattened away.
// That plain string is what GitHub slugs, so "#strike-order-…" matches.
export function headingChildrenToText(children: React.ReactNode): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(headingChildrenToText).join('');
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return headingChildrenToText(props.children);
  }
  return '';
}

type HeadingSourceNode = {
  position?: {
    start?: {
      offset?: number | null;
      line?: number | null;
      column?: number | null;
    };
  };
};

function headingPositionKey(node: HeadingSourceNode | undefined): string | null {
  const start = node?.position?.start;
  if (!start) return null;
  if (typeof start.offset === 'number') return String(start.offset);
  if (typeof start.line === 'number') return `${start.line}:${start.column ?? 0}`;
  return null;
}

const HeadingSluggerContext = React.createContext<HeadingSlugger | null>(null);

export function HeadingSluggerProvider({
  slugger,
  children,
}: {
  slugger: HeadingSlugger;
  children: React.ReactNode;
}) {
  return <HeadingSluggerContext.Provider value={slugger}>{children}</HeadingSluggerContext.Provider>;
}

type MarkdownHeadingProps = React.ComponentPropsWithoutRef<'h1'> & {
  level?: number;
  node?: HeadingSourceNode;
  // react-markdown also passes these. They are not DOM attributes.
  sourcePosition?: unknown;
  index?: number;
  siblingCount?: number;
};

const HEADING_TAG = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const;

// One renderer for every heading level. react-markdown passes `level`.
export function MarkdownHeading({
  level = 1,
  children,
  node,
  sourcePosition: _sourcePosition,
  index: _index,
  siblingCount: _siblingCount,
  ...props
}: MarkdownHeadingProps) {
  const slugger = React.useContext(HeadingSluggerContext);
  const text = headingChildrenToText(children);
  const id = slugger ? slugger.slug(text, headingPositionKey(node)) : undefined;
  const Tag = HEADING_TAG[level as keyof typeof HEADING_TAG] ?? 'h1';
  return (
    <Tag {...props} id={id}>
      {children}
    </Tag>
  );
}

const markdownHeadingComponents = {
  h1: MarkdownHeading,
  h2: MarkdownHeading,
  h3: MarkdownHeading,
  h4: MarkdownHeading,
  h5: MarkdownHeading,
  h6: MarkdownHeading,
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
  // Fresh ids on every render, in heading order. Cleared here, before the
  // markdown children render and call slug().
  const sluggerRef = useRef<HeadingSlugger | null>(null);
  let slugger = sluggerRef.current;
  if (slugger === null) {
    slugger = new HeadingSlugger();
    sluggerRef.current = slugger;
  }
  slugger.reset();

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

  // The markdown arrives after first paint, so the browser's own hash scroll
  // has already missed. Once the headings exist, scroll to one if the URL has it.
  useEffect(() => {
    if (state.status !== 'ok') return;
    const hash = window.location.hash;
    if (hash.length < 2) return;
    let id: string;
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }
    document.getElementById(id)?.scrollIntoView();
  }, [state]);

  // Fall back to a generic rules-reference head for any unknown file so a new or
  // mistyped doc never leaves the previous route's title/canonical/meta in place
  // on client-side navigation.
  const seo = DOC_SEO[file] ?? {
    title: 'Kill Team 2024 Rules Reference | ktcalc',
    description: 'Kill Team 2024 rules reference for the ktcalc shooting and fighting calculator.',
    path: '/help/',
  };

  return (
    <HeadingSluggerProvider slugger={slugger}>
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{ a: MarkdownLink, ...markdownHeadingComponents }}
            >
              {state.text}
            </ReactMarkdown>
          </div>
        )}

        <p className="RuleDoc-backBottom">
          <Link to="/help">&larr; Back to How it works</Link>
        </p>
      </Container>
    </HeadingSluggerProvider>
  );
};

export default RuleDocPage;
