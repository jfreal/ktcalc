import React from 'react';
import { Accordion } from 'react-bootstrap';

interface ChangelogEntry {
  date: string;
  title: string;
  changes: string[];
}

const changelogEntries: ChangelogEntry[] = [
  {
    date: 'December 2025',
    title: 'CeaselessPlusBalanced & Severe Rule Fixes',
    changes: [
      'Added CeaselessPlusBalanced: combined reroll that applies Ceaseless first, then Balanced on an unrerolled fail',
      'Fixed: Balanced can only target fails that weren\'t rerolled by Ceaseless (no double reroll rule)',
      'Fixed: All rerolls only target fails (optimal play - rerolling norms/crits can make results worse)',
      'Fixed: Severe rule now correctly blocks Punishing and Rending (Devastating and Piercing Crits still work)',
      'Moved Punishing from Advanced controls to main checkbox for easier access',
    ],
  },
  {
    date: 'December 2025',
    title: 'Kill Team 2024 Edition Updates',
    changes: [
      'Defense dice fixed at 3 for all operatives',
      'Removed invulnerable saves (not in KT2024)',
      'Added Ceaseless reroll ability (reroll all dice of one result)',
      'Updated Punishing rule implementation',
    ],
  },
  {
    date: 'November 2025',
    title: 'Initial KT2024 Support',
    changes: [
      'Updated calculator for Kill Team 2024 rules',
      'Added new weapon rules: Severe, Punishing, Shock',
      'Updated combat resolution sequence',
    ],
  },
];

const Changelog: React.FC = () => {
  return (
    <Accordion>
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <span style={{ fontWeight: 'bold' }}>Recent Improvements</span>
        </Accordion.Header>
        <Accordion.Body style={{ fontSize: '11px' }}>
          {changelogEntries.map((entry, index) => (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#0d6efd' }}>
                {entry.date} - {entry.title}
              </div>
              <ul style={{ marginBottom: '4px', paddingLeft: '20px' }}>
                {entry.changes.map((change, changeIndex) => (
                  <li key={changeIndex}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default Changelog;
