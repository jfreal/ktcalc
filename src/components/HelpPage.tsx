import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import Panel from 'src/components/Panel';
import * as T from 'src/theme';

interface DocLink {
  title: string;
  href: string;
  blurb: string;
}

// In-app deep-dive notes (React pages) explaining non-obvious calculator results.
const notes: DocLink[] = [
  {
    title: 'Lethal + Relentless: why kill chance can rise as BS gets worse',
    href: '/notes/lethal-relentless',
    blurb:
      'Walks the math for a scenario where the reported kill chance is higher at BS 5+ than BS 2+. ' +
      'Not a bug — Relentless feeds every failed die back into a fixed crit band, and kill chance is a tail probability, not an average.',
  },
  {
    title: 'Mystic Scry Buff + Rending: why the best choice depends on what you rolled',
    href: '/notes/mystic-scry-buff',
    blurb:
      'The "retain a fail as a norm, or a norm as a crit" decision is not fixed. Explains when each choice wins and how the calculator models it.',
  },
];

// Game-rules reference docs (rendered in-app from rules/*.md) that the engine
// is validated against.
const rulesDocs: DocLink[] = [
  {
    title: 'Combat rules — defense & the shooting save sequence',
    href: '/rules/combat',
    blurb:
      'Defense dice, saves, cover, Feel No Pain, Piercing, and Saintly Relics — how the shoot calculator resolves saves.',
  },
  {
    title: 'Fight rules — how melee is resolved',
    href: '/rules/fight',
    blurb:
      'The alternating strike/parry sequence, what a parry can cancel, the engine’s strike-vs-parry decision logic, and hand-verifiable scenarios.',
  },
  {
    title: 'Weapon rules — all weapon rule effects',
    href: '/rules/weapon',
    blurb:
      'Reference for every weapon rule the calculator supports: Accurate, Balanced, Brutal, Ceaseless, Devastating, Heavy, Lethal, Piercing, Punishing, Relentless, Rending, Saturate, Severe, Shock.',
  },
];

const DocItem: React.FC<{ doc: DocLink }> = ({ doc }) => (
  <div style={{ marginBottom: '14px' }}>
    <Link to={doc.href} style={{ fontSize: '15px', fontWeight: 600 }}>
      {doc.title} &rarr;
    </Link>
    <div style={{ fontSize: '13px', color: T.textMuted, marginTop: '2px' }}>{doc.blurb}</div>
  </div>
);

const HelpPage: React.FC = () => (
  <Container style={{ maxWidth: '760px', padding: '24px 16px', fontSize: '14px', lineHeight: 1.55 }}>
    <p><Link to="/">&larr; Back to calculator</Link></p>

    <h2>How KT Calc works</h2>

    <p>
      KT Calc is open about its math. These pages explain the logic behind the numbers — the
      surprising results worth a closer look, and the Kill Team 2024 rules the engine is built and
      validated against. Read through if you want to check the calculator by hand or understand why a
      result came out the way it did.
    </p>

    <div style={{ maxWidth: '620px', margin: '16px 0' }}>
      <Panel title="Deep-dive notes" titleFontSize="14px" fullWidth>
        {notes.map((doc) => (
          <DocItem key={doc.href} doc={doc} />
        ))}
      </Panel>
    </div>

    <div style={{ maxWidth: '620px', margin: '16px 0' }}>
      <Panel title="Game rules reference" titleFontSize="14px" fullWidth>
        {rulesDocs.map((doc) => (
          <DocItem key={doc.href} doc={doc} />
        ))}
      </Panel>
    </div>

    <p><Link to="/">&larr; Back to calculator</Link></p>
  </Container>
);

export default HelpPage;
