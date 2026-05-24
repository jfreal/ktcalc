import React from 'react';
import Table from 'react-bootstrap/Table';
import { killProb, weightedAverage } from 'src/Util';
import { range } from 'lodash';

export interface Props {
  saveToDmgToProb1: Map<number, Map<number, number>>;
  saveToDmgToProb2: Map<number, Map<number, number>>;
  saveToDmgToProbCombined: Map<number, Map<number, number>>;
  comboWounds: number;
}

// Style constants
const betterStyle: React.CSSProperties = { backgroundColor: '#e8f5e9' }; // very light green
const worseStyle: React.CSSProperties = { backgroundColor: '#ffebee' };  // very light red
const equalStyle: React.CSSProperties = { backgroundColor: '#f5f5f5' };  // very light gray
// Slightly darker variants for zebra striping
const betterStyleAlt: React.CSSProperties = { backgroundColor: '#c8e6c9' };
const worseStyleAlt: React.CSSProperties = { backgroundColor: '#ffcdd2' };
const equalStyleAlt: React.CSSProperties = { backgroundColor: '#e0e0e0' };
const cellStyle: React.CSSProperties = { width: '50px', maxWidth: '50px' };

// Theme constants — match AppHeader dark/orange palette
const themeDark = 'rgb(37,43,50)';
const themeMuted = '#d1d5db'; // light grey for secondary tables
const themeMutedBorder = '#9ca3af';
const themeAccent = '#e8731a';

const cardStyleBase: React.CSSProperties = {
  borderRadius: '4px',
  overflow: 'hidden',
  display: 'inline-block',
  verticalAlign: 'top',
  margin: '4px',
};
const cardStyle: React.CSSProperties = {
  ...cardStyleBase,
  border: `1px solid ${themeDark}`,
  borderLeft: `4px solid ${themeAccent}`,
};
const cardStyleMuted: React.CSSProperties = {
  ...cardStyleBase,
  border: `1px solid ${themeMutedBorder}`,
  borderLeft: `4px solid ${themeMutedBorder}`,
};

const cardTitleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: 'white',
  backgroundColor: themeDark,
  padding: '4px 8px',
};
const cardTitleStyleMuted: React.CSSProperties = {
  fontWeight: 'bold',
  color: themeDark,
  backgroundColor: themeMuted,
  padding: '4px 8px',
};

const themedTheadStyle: React.CSSProperties = { backgroundColor: themeDark, color: 'white' };

interface ThemedCardProps {
  title: React.ReactNode;
  titleFontSize?: string;
  variant?: 'primary' | 'muted';
  fullWidth?: boolean;
  noPadding?: boolean;
  children: React.ReactNode;
}
const ThemedCard: React.FC<ThemedCardProps> = ({ title, titleFontSize = '13px', variant = 'primary', fullWidth = false, noPadding = false, children }) => {
  const wrap = variant === 'muted' ? cardStyleMuted : cardStyle;
  const titleStyle = variant === 'muted' ? cardTitleStyleMuted : cardTitleStyle;
  const wrapFinal: React.CSSProperties = fullWidth
    ? { ...wrap, display: 'block', width: '100%', margin: 0 }
    : wrap;
  return (
    <div style={wrapFinal}>
      <div style={{ ...titleStyle, fontSize: titleFontSize }}>{title}</div>
      <div style={{ padding: noPadding ? 0 : '4px 8px' }}>{children}</div>
    </div>
  );
};

function getComparisonStyles(diff: number, alt = false): [React.CSSProperties, React.CSSProperties] {
  const better = alt ? betterStyleAlt : betterStyle;
  const worse = alt ? worseStyleAlt : worseStyle;
  const equal = alt ? equalStyleAlt : equalStyle;
  if (Math.abs(diff) < 0.001) {
    return [equal, equal];
  } else if (diff > 0) {
    return [better, worse];
  } else {
    return [worse, better];
  }
}

const ScenarioComparisonMatrix: React.FC<Props> = (props: Props) => {
  const [showSv6, setShowSv6] = React.useState(false);
  const allSaves = [...props.saveToDmgToProb1.keys()].sort();
  const saves = showSv6 ? allSaves : allSaves.filter(s => s !== 6);
  const woundRange = range(1, 26); // 1 to 25 wounds
  const toPercentString = (val: number) => (val * 100).toFixed(0);
  const { comboWounds, saveToDmgToProbCombined } = props;

  // Precompute per-save Avg + kill chances + per-save lastNonZeroWound
  const perSave = saves.map(save => {
    const dmgToProb1 = props.saveToDmgToProb1.get(save)!;
    const dmgToProb2 = props.saveToDmgToProb2.get(save)!;
    const avg1 = weightedAverage(dmgToProb1);
    const avg2 = weightedAverage(dmgToProb2);
    let lastNonZeroWound = 0;
    const kc1: number[] = [];
    const kc2: number[] = [];
    for (const w of woundRange) {
      const k1 = killProb(dmgToProb1, w);
      const k2 = killProb(dmgToProb2, w);
      kc1.push(k1);
      kc2.push(k2);
      if (k1 > 0 || k2 > 0) lastNonZeroWound = w;
    }
    return { save, avg1, avg2, kc1, kc2, lastNonZeroWound };
  });

  const globalLastNonZeroWound = Math.max(0, ...perSave.map(p => p.lastNonZeroWound));
  const visibleWounds = woundRange.filter(w => w <= globalLastNonZeroWound);

  const cellBase: React.CSSProperties = { textAlign: 'center', padding: '4px 4px' };
  const subHeaderStyle: React.CSSProperties = { ...cellBase, fontSize: '10px', fontWeight: 'normal' };
  const groupHeaderStyle: React.CSSProperties = {
    ...cellBase,
    borderLeft: `2px solid ${themeMutedBorder}`,
  };
  const groupCellStyle: React.CSSProperties = {
    borderLeft: `2px solid ${themeMutedBorder}`,
  };
  const zebraEven: React.CSSProperties = { backgroundColor: '#ffffff' };
  const zebraOdd: React.CSSProperties = { backgroundColor: '#eef1f5' };
  const wColEven: React.CSSProperties = { backgroundColor: '#e2e8f0' };
  const wColOdd: React.CSSProperties = { backgroundColor: '#cbd5e1' };
  const labelCellStyle: React.CSSProperties = { ...cellBase, fontWeight: 'bold', backgroundColor: '#eeeeee' };

  const renderSaveCells = (
    save: number,
    v1: number,
    v2: number,
    diff: number,
    fmt: (n: number) => string,
    rowBg: React.CSSProperties,
    diffPrefix: boolean,
    alt: boolean,
  ) => {
    const [s1Style, s2Style] = getComparisonStyles(diff, alt);
    return (
      <React.Fragment key={`cells_${save}`}>
        <td style={{ ...cellBase, ...groupCellStyle, ...rowBg, ...s1Style }}>{fmt(v1)}</td>
        <td style={{ ...cellBase, ...rowBg, ...s2Style }}>{fmt(v2)}</td>
        <td style={{ ...cellBase, ...rowBg }}>{diffPrefix && diff > 0 ? '+' : ''}{fmt(diff)}</td>
      </React.Fragment>
    );
  };

  const unifiedTable = (
    <ThemedCard
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span>Comparison Matrix (Avg Dmg + Kill % vs W)</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'normal', cursor: 'pointer', marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={showSv6}
              onChange={e => setShowSv6(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Show Sv 6+
          </label>
        </div>
      }
      fullWidth
      noPadding
    >
      <Table bordered style={{ fontSize: '11px', marginTop: 0, marginBottom: 0, width: '100%' }}>
        <thead style={themedTheadStyle}>
          <tr>
            <th rowSpan={2} style={{ ...cellBase, verticalAlign: 'middle', width: '50px' }}>W</th>
            {perSave.map(p => (
              <th key={`gh_${p.save}`} colSpan={3} style={groupHeaderStyle}>
                Sv {p.save}+
              </th>
            ))}
          </tr>
          <tr>
            {perSave.map(p => (
              <React.Fragment key={`sh_${p.save}`}>
                <th style={{ ...subHeaderStyle, ...groupCellStyle }}>S1</th>
                <th style={subHeaderStyle}>S2</th>
                <th style={subHeaderStyle}>Δ</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={labelCellStyle}>Avg</td>
            {perSave.map(p => {
              const diff = p.avg1 - p.avg2;
              return renderSaveCells(p.save, p.avg1, p.avg2, diff, (n) => n.toFixed(2), labelCellStyle, true, false);
            })}
          </tr>
          {visibleWounds.map((w, idx) => {
            const rowBg = idx % 2 === 0 ? zebraEven : zebraOdd;
            const wBg = idx % 2 === 0 ? wColEven : wColOdd;
            return (
              <tr key={`row_w_${w}`}>
                <td style={{ ...cellBase, ...wBg, fontWeight: 'bold' }}>{w}</td>
                {perSave.map(p => {
                  if (w > p.lastNonZeroWound) {
                    return (
                      <React.Fragment key={`cells_${p.save}_${w}`}>
                        <td style={{ ...cellBase, ...groupCellStyle, ...rowBg, color: '#999' }}>0%</td>
                        <td style={{ ...cellBase, ...rowBg, color: '#999' }}>0%</td>
                        <td style={{ ...cellBase, ...rowBg }}>—</td>
                      </React.Fragment>
                    );
                  }
                  const k1 = p.kc1[idx];
                  const k2 = p.kc2[idx];
                  const diff = k1 - k2;
                  return renderSaveCells(p.save, k1, k2, diff, (n) => `${toPercentString(n)}%`, rowBg, true, idx % 2 === 1);
                })}
              </tr>
            );
          })}
          {globalLastNonZeroWound < woundRange[woundRange.length - 1] && (
            <tr key="row_zero_tail">
              <td style={{ ...cellBase, ...zebraEven, fontWeight: 'bold' }}>{globalLastNonZeroWound + 1}+</td>
              <td style={{ ...cellBase, ...zebraEven, color: '#999' }} colSpan={perSave.length * 3}>0%</td>
            </tr>
          )}
        </tbody>
      </Table>
    </ThemedCard>
  );

  const comboBlock = (
    <ThemedCard title={`S1 & S2 Combined Shots (Kill chance vs W=${comboWounds})`} titleFontSize="15px">
      <Table bordered style={{ fontSize: '11px', marginTop: '2px', marginBottom: 0, tableLayout: 'fixed', width: 'auto' }}>
        <thead style={themedTheadStyle}>
          <tr>
            <th style={cellStyle}>Sv</th>
            <th style={cellStyle}>Avg</th>
            <th style={cellStyle}>Kill%</th>
          </tr>
        </thead>
        <tbody>
          {saves.map(save => {
            const dmgToProb = saveToDmgToProbCombined.get(save)!;
            const avgDmg = weightedAverage(dmgToProb);
            const kill = killProb(dmgToProb, comboWounds);
            return (
              <tr key={`combo_${save}`}>
                <td style={cellStyle}>{save}+</td>
                <td style={cellStyle}>{avgDmg.toFixed(2)}</td>
                <td style={cellStyle}>{toPercentString(kill)}%</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </ThemedCard>
  );

  return (
    <div style={{ padding: '8px', maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ marginBottom: '16px' }}>
        {comboBlock}
      </div>

      <div style={{ fontSize: '11px', marginBottom: '8px', color: '#666' }}>
        <span style={{ backgroundColor: '#e8f5e9', padding: '2px 4px' }}>Green = Better</span>
        {' | '}
        <span style={{ backgroundColor: '#ffebee', padding: '2px 4px' }}>Red = Worse</span>
        {' | '}
        <span style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>Gray = Equal</span>
      </div>

      <div style={{ width: '100%' }}>
        {unifiedTable}
      </div>
    </div>
  );
};

export default ScenarioComparisonMatrix;
