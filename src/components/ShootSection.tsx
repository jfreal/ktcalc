import React from 'react';
import Panel from 'src/components/Panel';
import 'src/components/Controls.css';

import { clone } from 'lodash';
import Note, * as N from 'src/Notes';
import NotesList from 'src/components/NotesList';
import { attackerNotedControls } from 'src/components/AttackerControls';
import { defenderNotedControls } from 'src/components/DefenderControls';
import { notesFromControls } from 'src/components/controlNotes';
import { ShootSituation } from './ShootSituation';
import Model from 'src/Model';
import ShootOptions from 'src/ShootOptions';
import { calcDmgProbs } from 'src/CalcEngineShoot';
import { SaveRange } from 'src/KtMisc';
import ScenarioComparisonMatrix from './ScenarioComparisonMatrix';
import { combineDmgProbs } from 'src/CalcEngineCommon';
import { useUrlState, getStateFromUrl } from 'src/hooks/useUrlState';
import { useShareContext } from 'src/context/ShareContext';

interface ShootSectionProps {
  isActive: boolean;
}

// Control notes come from the attacker and defender catalogs those panels render. A rule that is
// basic on either panel stays in Basic (Punishing and Reroll are always visible on one side).
const shootControlNotes = notesFromControls([
  ...attackerNotedControls,
  ...defenderNotedControls,
]);
// AvgDamageUnbounded explains the results "Average Damage" figure. It is not a control.
const notes: Note[] = [N.AvgDamageUnbounded, ...shootControlNotes.notes];
const advancedNotes = shootControlNotes.advancedNotes;

const ShootSection: React.FC<ShootSectionProps> = ({ isActive }) => {
  // Load initial state from URL if present
  const initialState = React.useMemo(() => getStateFromUrl(), []);
  
  const [attacker1, setAttacker1] = React.useState(() => initialState.s1?.attacker ?? new Model());
  const [defender1, setDefender1] = React.useState(() => initialState.s1?.defender ?? Model.basicDefender());
  const [shootOptions1, setShootOptions1] = React.useState(() => initialState.s1?.shootOptions ?? new ShootOptions());

  const saveToDmgToProb1 = React.useMemo(
    () => new Map<number,Map<number,number>>(SaveRange.map(save =>
      [save, calcDmgProbs(attacker1, defender1.withProp('diceStat', save), shootOptions1)])),
    [attacker1, defender1, shootOptions1]);

  const [attacker2, setAttacker2] = React.useState(() => initialState.s2?.attacker ?? new Model());
  const [defender2, setDefender2] = React.useState(() => initialState.s2?.defender ?? Model.basicDefender());
  const [shootOptions2, setShootOptions2] = React.useState(() => initialState.s2?.shootOptions ?? new ShootOptions());

  // URL sharing functions
  const { getShareUrl, addParamsToUrl } = useUrlState(attacker1, defender1, shootOptions1, attacker2, defender2, shootOptions2);
  const { setShareFunctions } = useShareContext();

  // Register share functions with context when this view is active
  React.useEffect(() => {
    if (isActive) {
      setShareFunctions({ getShareUrl, addParamsToUrl });
    }
  }, [getShareUrl, addParamsToUrl, setShareFunctions, isActive]);

  const saveToDmgToProb2 = React.useMemo(
    () => new Map<number,Map<number,number>>(SaveRange.map(save =>
      [save, calcDmgProbs(attacker2, defender2.withProp('diceStat', save), shootOptions2)])),
    [attacker2, defender2, shootOptions2]);

  const saveToDmgToProbCombined = new Map<number,Map<number,number>>(SaveRange.map(save =>
    [save, combineDmgProbs(saveToDmgToProb1.get(save)!, saveToDmgToProb2.get(save)!)]));

  const copyS1toS2 = () => {
    setAttacker2(clone(attacker1));
    setDefender2(clone(defender1));
    setShootOptions2(clone(shootOptions1));
  };

  const situationTitleStyle: React.CSSProperties = { padding: '0 8px 0 12px' };
  const situationBodyStyle: React.CSSProperties = { padding: '10px 12px 12px' };
  const situationStyle: React.CSSProperties = { flex: '1 1 520px', minWidth: 0 };

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '12px 12px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontSize: '15px' }}>
        <span style={{ fontWeight: 600 }}>Kill Team 2024 Edition, Shooting</span>
        <a href='https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf' style={{ fontSize: '13px' }}>Lite Rules ↗</a>
      </div>
      {/* Side by side when both fit (~1064px), stacked below that. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Panel title="Situation 1" bodyScrollX style={situationStyle} titleStyle={situationTitleStyle} bodyStyle={situationBodyStyle}>
          <ShootSituation
            idPrefix="s1"
            attacker={attacker1}
            setAttacker={setAttacker1}
            defender={defender1}
            setDefender={setDefender1}
            shootOptions={shootOptions1}
            setShootOptions={setShootOptions1}
            saveToDmgToProb={saveToDmgToProb1}
            />
        </Panel>
        <Panel
          title="Situation 2"
          right={<button type="button" className="SmallBtn" onClick={copyS1toS2}>Copy From Situation 1</button>}
          bodyScrollX
          style={situationStyle}
          titleStyle={situationTitleStyle}
          bodyStyle={situationBodyStyle}
        >
          <ShootSituation
            idPrefix="s2"
            attacker={attacker2}
            setAttacker={setAttacker2}
            defender={defender2}
            setDefender={setDefender2}
            shootOptions={shootOptions2}
            setShootOptions={setShootOptions2}
            saveToDmgToProb={saveToDmgToProb2}
            />
        </Panel>
      </div>
      <ScenarioComparisonMatrix
        saveToDmgToProb1={saveToDmgToProb1}
        saveToDmgToProb2={saveToDmgToProb2}
        saveToDmgToProbCombined={saveToDmgToProbCombined}
        comboWounds={defender1.wounds}
      />
      <Panel title="Notes" fullWidth bodyStyle={{ padding: '10px 12px 12px', fontSize: '13px', lineHeight: 1.45 }}>
        <NotesList notes={notes} advancedNotes={advancedNotes} />
      </Panel>
    </div>
  );
};

export default ShootSection;
