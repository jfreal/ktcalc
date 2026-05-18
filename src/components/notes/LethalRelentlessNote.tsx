import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const tdRight: React.CSSProperties = { textAlign: 'right', padding: '2px 10px' };
const tdLeft: React.CSSProperties = { textAlign: 'left', padding: '2px 10px' };
const th: React.CSSProperties = { textAlign: 'left', padding: '4px 10px', borderBottom: '1px solid #ccc' };

const LethalRelentlessNote: React.FC = () => (
  <Container style={{ maxWidth: '760px', padding: '24px 16px', fontSize: '14px', lineHeight: 1.55 }}>
    <p><Link to="/">&larr; Back to calculator</Link></p>

    <h2>Lethal + Relentless: why kill chance can rise as BS gets worse</h2>

    <p>
      It is possible to set up a Kill Team shooting scenario where the calculator reports a
      <em> higher</em> kill chance at BS 5+ than at BS 2+, even though every other input is identical.
      This is not a calculator bug. It is a real consequence of how Lethal and Relentless are defined
      in KT2024. This note walks through the math.
    </p>

    <h3>The two rules</h3>

    <p>
      <strong>Lethal X+</strong> means an attack die scores a critical hit on an unmodified roll of X
      or higher, instead of the default 6+. The crit threshold is <em>absolute</em>. It does not move
      when BS changes. Norm hits fill the band between BS and Lethal; anything below BS is still a
      fail.
    </p>

    <p>
      <strong>Relentless</strong> lets you re-roll any number of your attack dice. The calculator
      models this as one re-roll per failed die, where each re-rolled die is statistically identical
      to the original.
    </p>

    <h3>Per-die crit probability with Lethal 5+, Relentless</h3>

    <p>
      Crit faces are always <code>{'{5, 6}'}</code> (2 of 6) regardless of BS. BS only controls the
      norm/fail boundary. After one allowed re-roll per fail, per-die probabilities are:
    </p>

    <table style={{ borderCollapse: 'collapse', margin: '8px 0 16px' }}>
      <thead>
        <tr>
          <th style={th}>BS</th>
          <th style={th}>Base crit</th>
          <th style={th}>Base norm</th>
          <th style={th}>Base fail</th>
          <th style={th}>Final crit</th>
          <th style={th}>Final norm</th>
          <th style={th}>Final fail</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={tdLeft}>2+</td><td style={tdRight}>2/6</td><td style={tdRight}>3/6</td><td style={tdRight}>1/6</td>
          <td style={tdRight}><strong>14/36 &asymp; 0.389</strong></td><td style={tdRight}>21/36</td><td style={tdRight}>1/36</td>
        </tr>
        <tr>
          <td style={tdLeft}>3+</td><td style={tdRight}>2/6</td><td style={tdRight}>2/6</td><td style={tdRight}>2/6</td>
          <td style={tdRight}><strong>16/36 &asymp; 0.444</strong></td><td style={tdRight}>16/36</td><td style={tdRight}>4/36</td>
        </tr>
        <tr>
          <td style={tdLeft}>4+</td><td style={tdRight}>2/6</td><td style={tdRight}>1/6</td><td style={tdRight}>3/6</td>
          <td style={tdRight}><strong>18/36 = 0.500</strong></td><td style={tdRight}>9/36</td><td style={tdRight}>9/36</td>
        </tr>
        <tr>
          <td style={tdLeft}>5+</td><td style={tdRight}>2/6</td><td style={tdRight}>0</td><td style={tdRight}>4/6</td>
          <td style={tdRight}><strong>20/36 &asymp; 0.556</strong></td><td style={tdRight}>0</td><td style={tdRight}>16/36</td>
        </tr>
      </tbody>
    </table>

    <p>
      Per-die crit probability <em>rises monotonically as BS degrades</em>. Each fail is a free
      re-roll, and every re-roll has the same 2/6 chance of landing in the fixed crit band. Worse BS
      just means more re-rolls feeding the same funnel.
    </p>

    <h3>Average damage falls, but that is not the same as kill chance</h3>

    <p>Expected damage per die (crit dmg 4, norm dmg 3, before saves):</p>

    <table style={{ borderCollapse: 'collapse', margin: '8px 0 16px' }}>
      <thead>
        <tr><th style={th}>BS</th><th style={th}>E[dmg per die]</th></tr>
      </thead>
      <tbody>
        <tr><td style={tdLeft}>2+</td><td style={tdRight}>14/36&middot;4 + 21/36&middot;3 &asymp; 3.31</td></tr>
        <tr><td style={tdLeft}>3+</td><td style={tdRight}>16/36&middot;4 + 16/36&middot;3 &asymp; 3.11</td></tr>
        <tr><td style={tdLeft}>4+</td><td style={tdRight}>18/36&middot;4 + 9/36&middot;3 &asymp; 2.75</td></tr>
        <tr><td style={tdLeft}>5+</td><td style={tdRight}>20/36&middot;4 &asymp; 2.22</td></tr>
      </tbody>
    </table>

    <p>
      Averages behave intuitively: better BS, more average damage. But <strong>kill chance is a tail
      probability</strong>, not an average. The shape of the distribution matters more than its mean.
    </p>

    <h3>Why the tail flips</h3>

    <p>
      Against a 12-wound target with 4 attack dice and 2 defender dice (Piercing 1), the defender
      cancels roughly 1.3 hits on average, so about 2.7 hits leak. To reach 12 leaked damage you
      essentially need 3+ crits to leak. Norms (3 damage) get preferentially absorbed by the
      defender&apos;s norm saves and rarely close a 12-damage gap on their own.
    </p>

    <p>So kill probability is dominated by <code>P(&ge; 3 crits in 4 dice)</code>:</p>

    <table style={{ borderCollapse: 'collapse', margin: '8px 0 16px' }}>
      <thead>
        <tr><th style={th}>BS</th><th style={th}>p (crit per die)</th><th style={th}>P(&ge; 3 crits in 4)</th></tr>
      </thead>
      <tbody>
        <tr><td style={tdLeft}>2+</td><td style={tdRight}>0.389</td><td style={tdRight}>&asymp; 0.169</td></tr>
        <tr><td style={tdLeft}>3+</td><td style={tdRight}>0.444</td><td style={tdRight}>&asymp; 0.234</td></tr>
        <tr><td style={tdLeft}>4+</td><td style={tdRight}>0.500</td><td style={tdRight}>&asymp; 0.313</td></tr>
        <tr><td style={tdLeft}>5+</td><td style={tdRight}>0.556</td><td style={tdRight}>&asymp; 0.404</td></tr>
      </tbody>
    </table>

    <p>
      That 2.4&times; rise from BS 2+ to BS 5+ matches the inversion the calculator reports.
      The BS 2+ attacker throws more total hits, but most of them are norms; the BS 5+ attacker
      throws fewer hits, but a far higher share of them are crits, and only crit-heavy rolls breach
      the kill line.
    </p>

    <h3>Indomitus amplifies the inversion</h3>

    <p>
      Indomitus adds one defender norm save when the defender rolls two fails. A norm save eats a
      norm hit one-for-one (or two norm saves stop a crit). So:
    </p>

    <ul>
      <li>
        At BS 2+, the attacker generates many norm hits &mdash; Indomitus has a target to cancel,
        so damage drops noticeably and kill chance drops a lot.
      </li>
      <li>
        At BS 5+, the attacker generates zero norm hits &mdash; Indomitus&apos; bonus norm save
        lands on nothing, so kill chance is unchanged.
      </li>
    </ul>

    <p>
      Indomitus is essentially a &quot;norm-hit eraser.&quot; It cools off norm-heavy attacks
      (low-BS Lethal builds) but does nothing to crit-pure attacks (high-BS Lethal builds), which
      stretches the kill-chance gap between low and high BS.
    </p>

    <h3>Take-aways</h3>

    <ol>
      <li>
        With Lethal, per-die crit probability is independent of BS. Adding Relentless makes per-die
        crit probability <em>increase</em> as BS worsens.
      </li>
      <li>
        Against a high wound threshold relative to attack volume, kill chance is driven by crit-spike
        probability, not by expected damage. The two can move in opposite directions.
      </li>
      <li>
        Indomitus and similar norm-hit cancellers compound the effect because they only suppress the
        kind of damage that good-BS Lethal builds rely on.
      </li>
      <li>
        The rule of thumb &quot;better BS always means more kills&quot; only holds when the crit
        threshold scales with BS (the default 6+ case). Lethal pins it absolute; Relentless funnels
        fails into that pin.
      </li>
    </ol>

    <p><Link to="/">&larr; Back to calculator</Link></p>
  </Container>
);

export default LethalRelentlessNote;
