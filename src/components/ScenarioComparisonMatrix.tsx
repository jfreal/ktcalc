import React from 'react';
import Table from 'react-bootstrap/Table';
import { killProb, weightedAverage } from 'src/Util';
import { range } from 'lodash';

export interface Props {
  saveToDmgToProb1: Map<number, Map<number, number>>;
  saveToDmgToProb2: Map<number, Map<number, number>>;
}

// Style constants
const betterStyle: React.CSSProperties = { backgroundColor: '#e8f5e9' }; // very light green
const worseStyle: React.CSSProperties = { backgroundColor: '#ffebee' };  // very light red
const equalStyle: React.CSSProperties = { backgroundColor: '#f5f5f5' };  // very light gray

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
  const woundRange = range(1, 21); // 1 to 20 wounds
  const toPercentString = (val: number) => (val * 100).toFixed(0);

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
        <td>{save}+</td>
        <td style={s1Style}>{avgDmg1.toFixed(2)}</td>
        <td style={s2Style}>{avgDmg2.toFixed(2)}</td>
        <td>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</td>
      </tr>
    );
  });

  const avgDmgTable = (
    <div style={{ display: 'inline-block', verticalAlign: 'top', margin: '4px' }}>
      <Table bordered style={{ fontSize: '11px', marginTop: '2px' }}>
        <thead>
          <tr>
            <th>Sv</th>
            <th>S1 Avg</th>
            <th>S2 Avg</th>
            <th>Δ</th>
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

    const tableRows: JSX.Element[] = woundRange.map(wounds => {
      const killChance1 = killProb(dmgToProb1, wounds);
      const killChance2 = killProb(dmgToProb2, wounds);
      const diff = killChance1 - killChance2;
      const [s1Style, s2Style] = getComparisonStyles(diff);

      return (
        <tr key={`compare_${save}_${wounds}`}>
          <td>{wounds}</td>
          <td style={s1Style}>{toPercentString(killChance1)}%</td>
          <td style={s2Style}>{toPercentString(killChance2)}%</td>
          <td>{diff > 0 ? '+' : ''}{toPercentString(diff)}%</td>
        </tr>
      );
    });

    return (
      <div key={`table_${save}`} style={{ display: 'inline-block', verticalAlign: 'top', margin: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Sv {save}+</span>
        <Table bordered style={{ fontSize: '11px', marginTop: '2px' }}>
          <thead>
            <tr>
              <th>W</th>
              <th>S1</th>
              <th>S2</th>
              <th>Δ</th>
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
    <div style={{ padding: '8px' }}>
      <div style={{ fontSize: '11px', marginBottom: '8px', color: '#666' }}>
        <span style={{ backgroundColor: '#e8f5e9', padding: '2px 4px' }}>Green = Better</span>
        {' | '}
        <span style={{ backgroundColor: '#ffebee', padding: '2px 4px' }}>Red = Worse</span>
        {' | '}
        <span style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>Gray = Equal</span>
      </div>
      
      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
        Average Damage Comparison
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        {avgDmgTable}
      </div>

      <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
        Kill Chance Comparison (W: 1-20)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {killChanceTables}
      </div>
    </div>
  );
};

export default ScenarioComparisonMatrix;
