import React from 'react';
import {
  Button,
  Col,
  Container,
  Row,
} from 'react-bootstrap';

import Footer from 'src/components/Footer';
import Panel from 'src/components/Panel';
import * as T from 'src/theme';

import { clone } from 'lodash';
import Note, * as N from 'src/Notes';
import NotesList from 'src/components/NotesList';
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

  const notes: Note[] = [
    N.AvgDamageUnbounded,
    N.Reroll,
    N.Rending,
    N.Severe,
    N.ObscuredTarget,
    N.AutoNorms,
    N.AutoCrits,
    N.CoverNormSaves,
    N.CoverCritSaves,
    N.NormsToCrits,
    N.PuritySeal,
    N.MysticScryBuff,
    N.CloseAssault2021,
    N.HardyX,
    N.FeelNoPain,
    N.SaintlyRelics,
    N.JustAScratch2021,
    N.JustAScratchNorms,
  ];
  // Rules whose control only appears under the attacker's or defender's "Advanced" checkbox.
  // Keep in sync with AttackerControls.advancedParams and DefenderControls.advancedParams.
  const advancedNotes = new Set<Note>([
    N.AutoCrits,
    N.CoverCritSaves,
    N.NormsToCrits,
    N.PuritySeal,
    N.MysticScryBuff,
    N.CloseAssault2021,
    N.HardyX,
    N.FeelNoPain,
    N.SaintlyRelics,
  ]);

  return (
    <Container fluid style={{maxWidth: '1320px', margin: '0 auto'}}>
      <Row>
        <Col className='p-1'>
          Kill Team 2024 Edition, Shooting&nbsp;
          <a href='https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf'>[Lite Rules]</a>
        </Col>
      </Row>
      <Row>
        <Col xs={12} lg={6} className='p-1'>
          <Panel title="Situation 1" fullWidth bodyScrollX>
            <ShootSituation
              attacker={attacker1}
              setAttacker={setAttacker1}
              defender={defender1}
              setDefender={setDefender1}
              shootOptions={shootOptions1}
              setShootOptions={setShootOptions1}
              saveToDmgToProb={saveToDmgToProb1}
              />
          </Panel>
        </Col>
        <Col xs={12} lg={6} className='p-1'>
          <Panel
            title="Situation 2"
            right={<Button variant="dark" size="sm" onClick={copyS1toS2} style={{ backgroundColor: T.darkHover, borderColor: '#5a6470' }}>Copy From Situation 1</Button>}
            fullWidth
            bodyScrollX
          >
            <ShootSituation
              attacker={attacker2}
              setAttacker={setAttacker2}
              defender={defender2}
              setDefender={setDefender2}
              shootOptions={shootOptions2}
              setShootOptions={setShootOptions2}
              saveToDmgToProb={saveToDmgToProb2}
              />
          </Panel>
        </Col>
      </Row>
      <Row>
        <Col className='p-1'>
          <ScenarioComparisonMatrix
            saveToDmgToProb1={saveToDmgToProb1}
            saveToDmgToProb2={saveToDmgToProb2}
            saveToDmgToProbCombined={saveToDmgToProbCombined}
            comboWounds={defender1.wounds}
          />
        </Col>
      </Row>
      <Row>
        <Col className='p-1'>
          <Panel title="Notes" fullWidth>
            <NotesList notes={notes} advancedNotes={advancedNotes} />
          </Panel>
        </Col>
      </Row>
      <Footer />
    </Container>
  );
};

export default ShootSection;
