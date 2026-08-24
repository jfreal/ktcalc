import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import Panel from 'src/components/Panel';
import Seo from 'src/components/Seo';
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
  {
    title: 'Why Punishing can lower your damage',
    href: '/notes/punishing',
    blurb:
      'Switching on an ability that only adds a hit can reduce reported damage. Punishing retains the fail, '
      + 'locking it, where another effect would have left it promotable \u2014 so the promotion is stranded.',
  },
  {
    title: 'Comparing weapons by power level',
    href: '/rules/weapon-balance',
    blurb:
      'Which weapons are actually the same power level, measured against a fixed slate of targets — plain and with '
      + 'the buff that upgrades them, because a set that looks even can still come apart once everyone is buffed.',
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
    title: 'Retained vs modified dice — why cover saves cannot be promoted',
    href: '/rules/retained-vs-modified',
    blurb:
      'A dice can only be retained once. Sorts every effect into the ones that lock a dice (cover, Accurate, Punishing) ' +
      'and the ones that can still change it (Severe, Waaagh), and explains what the calculator does with each.',
  },
  {
    title: 'When not to take cover saves',
    href: '/rules/cover-saves',
    blurb:
      'Cover is optional, and occasionally worth declining: with norm\u2192crit save promotions against a mostly-critical '
      + 'attack, rolling the dice beats a locked normal save. Measured numbers, plus why the calculator always takes cover.',
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
    <Seo
      title="How the Kill Team 2024 Calculator Works | ktcalc"
      description="How ktcalc models Kill Team 2024 shooting and fighting: deep-dive notes on surprising results and the KT24 rules the engine is built and validated against."
      path="/help/"
    />
    <p><Link to="/">&larr; Back to calculator</Link></p>

    <h1>How KT Calc works</h1>

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
