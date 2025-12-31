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
const cellStyle: React.CSSProperties = { width: '50px', maxWidth: '50px' };

function getComparisonStyles(diff: number): [React.CSSProperties, React.CSSProperties] {
  if (Math.abs(diff) < 0.001) {
    return [equalStyle, equalStyle];
  } else if (diff > 0) {
    return [betterStyle, worseStyle];
  } else {
    return [worseStyle, betterStyle];
  }
}

const ScenarioComparisonMatrix: React.FC<Props> = (props: Props) => {
  const saves = [...props.saveToDmgToProb1.keys()].sort();
  const woundRange = range(1, 26); // 1 to 25 wounds
  const toPercentString = (val: number) => (val * 100).toFixed(0);
  const { comboWounds, saveToDmgToProbCombined } = props;

  // Generate average damage comparison table
  const avgDmgRows: JSX.Element[] = saves.map(save => {
    const dmgToProb1 = props.saveToDmgToProb1.get(save)!;
    const dmgToProb2 = props.saveToDmgToProb2.get(save)!;
    const avgDmg1 = weightedAverage(dmgToProb1);
    const avgDmg2 = weightedAverage(dmgToProb2);
    const diff = avgDmg1 - avgDmg2;
    const [s1Style, s2Style] = getComparisonStyles(diff);

    return (
      <tr key={`avgdmg_${save}`}>
        <td style={cellStyle}>{save}+</td>
        <td style={{ ...cellStyle, ...s1Style }}>{avgDmg1.toFixed(2)}</td>
        <td style={{ ...cellStyle, ...s2Style }}>{avgDmg2.toFixed(2)}</td>
        <td style={cellStyle}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</td>
      </tr>
    );
  });

  const avgDmgTable = (
    <div style={{ display: 'inline-block', verticalAlign: 'top', margin: '4px' }}>
      <Table bordered style={{ fontSize: '11px', marginTop: '2px', tableLayout: 'fixed', width: 'auto' }}>
        <thead>
          <tr>
            <th style={cellStyle}>Sv</th>
            <th style={cellStyle}>S1 Avg</th>
            <th style={cellStyle}>S2 Avg</th>
            <th style={cellStyle}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {avgDmgRows}
        </tbody>
      </Table>
    </div>
  );

  // Generate kill chance tables for each save value
  const killChanceTables = saves.map(save => {
    const dmgToProb1 = props.saveToDmgToProb1.get(save)!;
    const dmgToProb2 = props.saveToDmgToProb2.get(save)!;

    // Find the last wound value where at least one scenario has non-zero kill chance
    let lastNonZeroWound = 0;
    for (const wounds of woundRange) {
      const killChance1 = killProb(dmgToProb1, wounds);
      const killChance2 = killProb(dmgToProb2, wounds);
      if (killChance1 > 0 || killChance2 > 0) {
        lastNonZeroWound = wounds;
      }
    }

    // Only show rows up to the last non-zero wound value
    const truncatedRange = woundRange.filter(w => w <= lastNonZeroWound);
    
    const tableRows: JSX.Element[] = truncatedRange.map(wounds => {
      const killChance1 = killProb(dmgToProb1, wounds);
      const killChance2 = killProb(dmgToProb2, wounds);
      const diff = killChance1 - killChance2;
      const [s1Style, s2Style] = getComparisonStyles(diff);

      return (
        <tr key={`compare_${save}_${wounds}`}>
          <td style={cellStyle}>{wounds}</td>
          <td style={{ ...cellStyle, ...s1Style }}>{toPercentString(killChance1)}%</td>
          <td style={{ ...cellStyle, ...s2Style }}>{toPercentString(killChance2)}%</td>
          <td style={cellStyle}>{diff > 0 ? '+' : ''}{toPercentString(diff)}%</td>
        </tr>
      );
    });

    // Add a row indicating 0% for remaining wounds if we truncated
    if (lastNonZeroWound < woundRange[woundRange.length - 1]) {
      tableRows.push(
        <tr key={`compare_${save}_zero`}>
          <td style={cellStyle}>{lastNonZeroWound + 1}+</td>
          <td style={cellStyle} colSpan={3}>0%</td>
        </tr>
      );
    }

    return (
      <div key={`table_${save}`} style={{ display: 'inline-block', verticalAlign: 'top', margin: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Sv {save}+</span>
        <Table bordered style={{ fontSize: '11px', marginTop: '2px', tableLayout: 'fixed', width: 'auto' }}>
          <thead>
            <tr>
              <th style={cellStyle}>W</th>
              <th style={cellStyle}>S1</th>
              <th style={cellStyle}>S2</th>
              <th style={cellStyle}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {tableRows}
          </tbody>
        </Table>
      </div>
    );
  });

  return (
    <div style={{ padding: '8px', maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ fontSize: '11px', marginBottom: '8px', color: '#666' }}>
        <span style={{ backgroundColor: '#e8f5e9', padding: '2px 4px' }}>Green = Better</span>
        {' | '}
        <span style={{ backgroundColor: '#ffebee', padding: '2px 4px' }}>Red = Worse</span>
        {' | '}
        <span style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>Gray = Equal</span>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', overflowX: 'auto', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', height: '20px' }}>
            Average Damage Comparison
          </div>
          {avgDmgTable}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', height: '20px' }}>
            S1&S2 Combo (W={comboWounds})
          </div>
          <div style={{ display: 'inline-block', verticalAlign: 'top', margin: '4px' }}>
            <Table bordered style={{ fontSize: '11px', marginTop: '2px', tableLayout: 'fixed', width: 'auto' }}>
              <thead>
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
          </div>
        </div>
      </div>

      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
        Kill Chance Comparison (W: 1-25)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', overflowX: 'auto' }}>
        {killChanceTables}
      </div>
    </div>
  );
};

export default ScenarioComparisonMatrix;
