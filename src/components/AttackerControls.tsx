import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';

import {Props as IncProps, propsToRows} from 'src/components/IncDecSelect';
import {
  Accepter,
  boolToCheckX,
  incDecPropsHasNondefaultSelectedValue,
  makeNumChangeHandler,
  makeSetChangeHandlerForSingle,
  makeTextChangeHandler,
  preX,
  requiredAndOptionalItemsToTwoCols,
  rollSpan,
  span,
  xAndCheck,
  xspan,
} from 'src/Util';
import Model from 'src/Model';
import Ability, {
  rerollAbilities as rerolls,
} from 'src/Ability';
import Note, * as N from 'src/Notes';
import AdvancedMarker from 'src/components/AdvancedMarker';
import {
  NotedControl,
  ParamSpec,
  noteOf,
  notedControlsFromParams,
} from 'src/components/controlNotes';
import { useCheckboxAndVariable } from 'src/hooks/useCheckboxAndVariable';

export interface Props {
  attacker: Model;
  changeHandler: Accepter<Model>;
}

interface AbilityCheckbox {
  note: Note;
  ability: Ability;
}

export type AttackerParamId =
  | 'attacks'
  | 'bs'
  | 'normDmg'
  | 'critDmg'
  | 'devastating'
  | 'piercing'
  | 'piercingCrits'
  | 'reroll'
  | 'lethal'
  | 'autoNorms'
  | 'autoCrits'
  | 'failsToNorms'
  | 'normsToCrits'
  | 'puritySeal';

// Same list the Shoot notes panel reads. Punishing is an always-visible checkbox; FailsToNorms is
// an advanced param. Both therefore belong in Notes.
export const attackerParamSpecs: readonly ParamSpec<AttackerParamId>[] = [
  { id: 'attacks', advanced: false },
  { id: 'bs', advanced: false },
  { id: 'normDmg', advanced: false },
  { id: 'critDmg', advanced: false },
  { id: 'devastating', advanced: false },
  { id: 'piercing', advanced: false },
  { id: 'piercingCrits', advanced: false },
  { id: 'reroll', note: N.Reroll, advanced: false },
  { id: 'lethal', advanced: false },
  { id: 'autoNorms', note: N.AutoNorms, advanced: false },
  { id: 'autoCrits', note: N.AutoCrits, advanced: true },
  { id: 'failsToNorms', note: N.FailsToNorms, advanced: true },
  { id: 'normsToCrits', note: N.NormsToCrits, advanced: true },
  { id: 'puritySeal', note: N.PuritySeal, advanced: true },
];

export const attackerBasicCheckboxes: readonly AbilityCheckbox[] = [
  { note: N.Rending, ability: Ability.Rending },
  { note: N.Severe, ability: Ability.Severe },
  { note: N.Punishing, ability: Ability.Punishing },
];

export const attackerAdvancedCheckboxes: readonly AbilityCheckbox[] = [
  { note: N.MysticScryBuff, ability: Ability.MysticScryBuff },
  { note: N.CloseAssault2021, ability: Ability.FailToNormIfAtLeastTwoSuccesses },
];

export const attackerNotedControls: readonly NotedControl[] = [
  ...notedControlsFromParams(attackerParamSpecs),
  ...attackerBasicCheckboxes.map(box => ({ note: box.note, advanced: false })),
  ...attackerAdvancedCheckboxes.map(box => ({ note: box.note, advanced: true })),
];

const AttackerControls: React.FC<Props> = (props: Props) => {
  const atk = props.attacker;
  const textHandler = makeTextChangeHandler(atk, props.changeHandler);
  const numHandler = makeNumChangeHandler(atk, props.changeHandler);
  const [advancedCheckbox, wantShowAdvanced] = useCheckboxAndVariable('Advanced', false, true);

  function singleHandler(ability: Ability) {
    return makeSetChangeHandlerForSingle<Model,Ability>(
      atk,
      props.changeHandler,
      'abilities',
      ability,
    );
  }

  function toYN(ability: Ability) {
    return boolToCheckX(atk.has(ability));
  }

  function buildParam(spec: ParamSpec<AttackerParamId>): IncProps {
    switch (spec.id) {
      case 'attacks':
        return new IncProps('Attacks', atk.numDice, span(1, 9), numHandler('numDice'));
      case 'bs':
        return new IncProps('BS', atk.diceStat + '+', rollSpan, numHandler('diceStat'));
      case 'normDmg':
        return new IncProps('Normal Dmg', atk.normDmg, span(0, 9), numHandler('normDmg'));
      case 'critDmg':
        return new IncProps('Crit Dmg', atk.critDmg, span(0, 10), numHandler('critDmg'));
      case 'devastating':
        return new IncProps('Devastating', atk.mwx, xspan(1, 9), numHandler('mwx'));
      case 'piercing':
        return new IncProps('Piercing', atk.apx, xspan(1, 4), numHandler('apx'));
      case 'piercingCrits':
        return new IncProps('Piercing Crits', atk.px, xspan(1, 4), numHandler('px'));
      case 'reroll':
        return new IncProps(noteOf(spec), atk.reroll, preX(rerolls), textHandler('reroll'));
      case 'lethal':
        return new IncProps('Lethal', atk.lethal + '+', xspan(5, 2, '+'), numHandler('lethal'));
      case 'autoNorms':
        return new IncProps(noteOf(spec), atk.autoNorms, xspan(1, 3), numHandler('autoNorms'));
      case 'autoCrits':
        return new IncProps(noteOf(spec), atk.autoCrits, xspan(1, 9), numHandler('autoCrits'));
      case 'failsToNorms':
        return new IncProps(noteOf(spec), atk.failsToNorms, xspan(1, 9), numHandler('failsToNorms'));
      case 'normsToCrits':
        return new IncProps(noteOf(spec), atk.normsToCrits, xspan(1, 9), numHandler('normsToCrits'));
      case 'puritySeal':
        return new IncProps(noteOf(spec), toYN(Ability.PuritySeal), xAndCheck, singleHandler(Ability.PuritySeal));
      default: {
        const unexpected: never = spec.id;
        throw new Error(`unknown attacker control '${unexpected}'`);
      }
    }
  }

  const basicParams = attackerParamSpecs.filter(spec => !spec.advanced).map(buildParam);
  const advancedParams = attackerParamSpecs.filter(spec => spec.advanced).map(buildParam);
  // Every advanced param is hidden unless "Advanced" is ticked, so flag them to show the gear marker.
  advancedParams.forEach(p => { p.advanced = true; });

  const advancedParamsToShow
    = wantShowAdvanced
    ? advancedParams
    : advancedParams.filter(p => incDecPropsHasNondefaultSelectedValue(p));

  const [paramsCol0, paramsCol1] = requiredAndOptionalItemsToTwoCols(
    basicParams, advancedParamsToShow);

  const elemsCol0 = propsToRows(paramsCol0);
  const elemsCol1 = propsToRows(paramsCol1);

  function abilityCheckbox(box: AbilityCheckbox, advanced: boolean) {
    return (
      <Form.Check
        type="checkbox"
        label={advanced ? <>{box.note.name} <AdvancedMarker /></> : box.note.name}
        title={box.note.description}
        checked={atk.has(box.ability)}
        onChange={() => singleHandler(box.ability)(atk.has(box.ability) ? 'X' : '✔')}
      />
    );
  }

  return (
    <Container style={{width: '310px', maxWidth: '100%'}}>
      <Row>
        <Col>Attacker</Col>
        <Col>{advancedCheckbox}</Col>
      </Row>
      <Row>
        <Col>
          <Container className='p-0'>
            {elemsCol0}
          </Container>
        </Col>
        <Col>
          <Container className='p-0'>
            {elemsCol1}
          </Container>
        </Col>
      </Row>
      <Row>
        {attackerBasicCheckboxes.map(box => (
          <Col key={box.note.name}>{abilityCheckbox(box, false)}</Col>
        ))}
      </Row>
      {attackerAdvancedCheckboxes.map(box => {
        const show = wantShowAdvanced || atk.has(box.ability);
        return show ? (
          <Row key={box.note.name}>
            <Col>{abilityCheckbox(box, true)}</Col>
          </Row>
        ) : null;
      })}
    </Container>
  );
}

export default AttackerControls;
