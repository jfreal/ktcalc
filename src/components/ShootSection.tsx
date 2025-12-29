import React from 'react';
import {
  Button,
  Col,
  Container,
  Row,
} from 'react-bootstrap';

import Credits from 'src/components/Credits';

import { clone } from 'lodash';
import * as N from 'src/Notes';
import { ShootSituation } from './ShootSituation';
import Model from 'src/Model';
import ShootOptions from 'src/ShootOptions';
import { calcDmgProbs } from 'src/CalcEngineShoot';
import { SaveRange } from 'src/KtMisc';
import ScenarioComparisonMatrix from './ScenarioComparisonMatrix';
import { combineDmgProbs } from 'src/CalcEngineCommon';
import { useUrlState, getStateFromUrl } from 'src/hooks/useUrlState';
import { useShareContext } from 'src/context/ShareContext';

const ShootSection: React.FC = () => {
  // Load initial state from URL if present
  const initialState = React.useMemo(() => getStateFromUrl(), []);
  
  const [attacker1, setAttacker1] = React.useState(() => initialState.s1?.attacker ?? new Model());
  const [defender1, setDefender1] = React.useState(() => initialState.s1?.defender ?? Model.basicDefender());
  const [shootOptions1, setShootOptions1] = React.useState(new ShootOptions());

  const saveToDmgToProb1 = React.useMemo(
    () => new Map<number,Map<number,number>>(SaveRange.map(save =>
      [save, calcDmgProbs(attacker1, defender1.withProp('diceStat', save), shootOptions1)])),
    [attacker1, defender1, shootOptions1]);

  const [attacker2, setAttacker2] = React.useState(() => initialState.s2?.attacker ?? new Model());
  const [defender2, setDefender2] = React.useState(() => initialState.s2?.defender ?? Model.basicDefender());
  const [shootOptions2, setShootOptions2] = React.useState(new ShootOptions());

  // URL sharing functions
  const { getShareUrl, addParamsToUrl } = useUrlState(attacker1, defender1, attacker2, defender2);
  const { setShareFunctions } = useShareContext();

  // Register share functions with context
  React.useEffect(() => {
    setShareFunctions({ getShareUrl, addParamsToUrl });
  }, [getShareUrl, addParamsToUrl, setShareFunctions]);

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

  const noteListItems: JSX.Element[] = [
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
    N.CloseAssault2021,
    N.Durable2021,
    N.HardyX,
    N.FeelNoPain,
    N.JustAScratch2021,
  ].map(note => <li key={note.name}><b>{note.name}</b>: {note.description}</li>);

  return (
    <Container style={{width: 'fit-content'}}>
      <Row>
        Kill Team 2024 Edition, Shooting&nbsp;
        <a href='https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf'>[Lite Rules]</a>
      </Row>
      <Row>
        <Col className='border rounded p-1'>
          Situation 1
          <ShootSituation
            attacker={attacker1}
            setAttacker={setAttacker1}
            defender={defender1}
            setDefender={setDefender1}
            shootOptions={shootOptions1}
            setShootOptions={setShootOptions1}
            saveToDmgToProb={saveToDmgToProb1}
            />
        </Col>
        <Col className='border rounded p-1'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Situation 2</span>
            <Button variant="outline-secondary" size="sm" onClick={copyS1toS2}>Copy From Situation 1</Button>
          </div>
          <ShootSituation
            attacker={attacker2}
            setAttacker={setAttacker2}
            defender={defender2}
            setDefender={setDefender2}
            shootOptions={shootOptions2}
            setShootOptions={setShootOptions2}
            saveToDmgToProb={saveToDmgToProb2}
            />
        </Col>
      </Row>
      <Row>
        <Col className='border rounded p-0'>
          <ScenarioComparisonMatrix
            saveToDmgToProb1={saveToDmgToProb1}
            saveToDmgToProb2={saveToDmgToProb2}
            saveToDmgToProbCombined={saveToDmgToProbCombined}
            comboWounds={defender1.wounds}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <Credits/>
        </Col>
      </Row>
      <Row>
        <Col>
          Notes:
          <ul>
            {noteListItems}
          </ul>
        </Col>
      </Row>
    </Container>
  );
};

export default ShootSection;
