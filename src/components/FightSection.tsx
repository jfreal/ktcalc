import React from 'react';
import {
  Col,
  Container,
  Row,
} from 'react-bootstrap';
import Panel from 'src/components/Panel';
import * as Util from "src/Util";
import FighterControls, { fighterNotedControls } from 'src/components/FighterControls';
import Model from 'src/Model';
import FightOptionControls from 'src/components/FightOptionControls';
import { calcRemainingWounds } from 'src/CalcEngineFight';
import FightResultsDisplay from 'src/components/FightResultsDisplay';
import FightOptions from 'src/FightOptions';
import NotesList from 'src/components/NotesList';
import { notesFromControls } from 'src/components/controlNotes';
import { getFightStateFromUrl, useFightUrlState } from 'src/hooks/useUrlState';
import { useShareContext } from 'src/context/ShareContext';

interface FightSectionProps {
  isActive: boolean;
}

// Built from the same catalogs FighterControls renders, so the panel cannot list a rule the card
// does not have (or omit one it does). Close Assault and Waaagh are NicheAbility dropdown values.
const { notes, advancedNotes } = notesFromControls(fighterNotedControls);

const FightSection: React.FC<FightSectionProps> = ({ isActive }) => {
  // Load initial state from URL if present
  const initialState = React.useMemo(() => getFightStateFromUrl(), []);

  const [fighterA, setFighterA] = React.useState(() => initialState?.fighterA ?? new Model());
  const [fighterB, setFighterB] = React.useState(() => initialState?.fighterB ?? new Model());
  const [fightOptions, setFightOptions] = React.useState(() => initialState?.fightOptions ?? new FightOptions());

  // URL sharing functions
  const { getShareUrl, addParamsToUrl } = useFightUrlState(fighterA, fighterB, fightOptions);
  const { setShareFunctions } = useShareContext();

  React.useEffect(() => {
    if (isActive) {
      setShareFunctions({ getShareUrl, addParamsToUrl });
    }
  }, [getShareUrl, addParamsToUrl, setShareFunctions, isActive]);

  const aFirst = fightOptions.firstFighter === 'A';
  const [fighter1WoundProbs, fighter2WoundProbs] = React.useMemo(
    () => calcRemainingWounds(
      aFirst ? fighterA : fighterB,
      aFirst ? fighterB : fighterA,
      aFirst ? fightOptions.strategyFighterA : fightOptions.strategyFighterB,
      aFirst ? fightOptions.strategyFighterB : fightOptions.strategyFighterA,
      fightOptions.numRounds,
    ),
    [fighterA, fighterB, fightOptions, aFirst]);
  const fighterAWoundProbs = aFirst ? fighter1WoundProbs : fighter2WoundProbs;
  const fighterBWoundProbs = aFirst ? fighter2WoundProbs : fighter1WoundProbs;

  return (
    <Container style={{maxWidth: '1000px', margin: '0 auto'}}>
      <Row>
        <Col className='p-1'>
          Kill Team 2024 Edition, Fighting&nbsp;
          <a href='https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf'>[Lite Rules]</a>
        </Col>
      </Row>
      <Row>
        <Col xs={12} lg={6} className={Util.centerHoriz + ' p-1'}>
          <Panel title="Fighter A" fullWidth bodyScrollX>
            <FighterControls attacker={fighterA} changeHandler={setFighterA} />
          </Panel>
        </Col>
        <Col xs={12} lg={6} className={Util.centerHoriz + ' p-1'}>
          <Panel title="Fighter B" fullWidth bodyScrollX>
            <FighterControls attacker={fighterB} changeHandler={setFighterB} />
          </Panel>
        </Col>
      </Row>
      <Row>
        <Col className='p-1'>
          <Panel title="Fight Options" fullWidth bodyScrollX>
            <FightOptionControls
              fightOptions={fightOptions}
              changeHandler={setFightOptions}
            />
          </Panel>
        </Col>
      </Row>
      <Row>
        <Col className='p-1'>
          <Panel title="Results" fullWidth bodyScrollX>
            <FightResultsDisplay
              fighterAWoundProbs={fighterAWoundProbs}
              fighterBWoundProbs={fighterBWoundProbs}
              fighterAWoundsOrig={fighterA.wounds}
              fighterBWoundsOrig={fighterB.wounds}
            />
          </Panel>
        </Col>
      </Row>
      <Row>
        <Col className='p-1'>
          <Panel title="Notes" fullWidth>
            <NotesList notes={notes} advancedNotes={advancedNotes}>
              <li>
                All strategies will do certain no-downside actions, with the consequence that
                "Strike" will still sometimes parry and "Parry" will still sometimes strike.
                <ul>
                  <li>If fighter can kill enemy in next strike, they will do so.</li>
                  <li>If fighter can parry enemy's last success and still kill enemy afterwards, they will do so.</li>
                </ul>
              </li>
              <li>
                Balanced and Relentless will not reroll a normal success even if it would be wise to do so.
              </li>
            </NotesList>
          </Panel>
        </Col>
      </Row>
    </Container>
  );
};

export default FightSection;
