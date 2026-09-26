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
import * as N from 'src/Notes';
import AdvancedMarker from 'src/components/AdvancedMarker';
import {
  AbilityCheckbox,
  NotedControl,
  ParamSpec,
  buildParams,
  notedControlsFromCheckboxes,
  notedControlsFromParams,
} from 'src/components/controlNotes';
import { useCheckboxAndVariable } from 'src/hooks/useCheckboxAndVariable';

export interface Props {
  attacker: Model;
  changeHandler: Accepter<Model>;
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
  { id: 'attacks', label: 'Attacks', advanced: false },
  { id: 'bs', label: 'BS', advanced: false },
  { id: 'normDmg', label: 'Normal Dmg', advanced: false },
  { id: 'critDmg', label: 'Crit Dmg', advanced: false },
  { id: 'devastating', label: 'Devastating', advanced: false },
  { id: 'piercing', label: 'Piercing', advanced: false },
  { id: 'piercingCrits', label: 'Piercing Crits', advanced: false },
  { id: 'reroll', label: N.Reroll, advanced: false },
  { id: 'lethal', label: 'Lethal', advanced: false },
  { id: 'autoNorms', label: N.AutoNorms, advanced: false },
  { id: 'autoCrits', label: N.AutoCrits, advanced: true },
  { id: 'failsToNorms', label: N.FailsToNorms, advanced: true },
  { id: 'normsToCrits', label: N.NormsToCrits, advanced: true },
  { id: 'puritySeal', label: N.PuritySeal, advanced: true },
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
  ...notedControlsFromCheckboxes(attackerBasicCheckboxes, false),
  ...notedControlsFromCheckboxes(attackerAdvancedCheckboxes, true),
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
        return new IncProps(spec.label, atk.numDice, span(1, 9), numHandler('numDice'));
      case 'bs':
        return new IncProps(spec.label, atk.diceStat + '+', rollSpan, numHandler('diceStat'));
      case 'normDmg':
        return new IncProps(spec.label, atk.normDmg, span(0, 9), numHandler('normDmg'));
      case 'critDmg':
        return new IncProps(spec.label, atk.critDmg, span(0, 10), numHandler('critDmg'));
      case 'devastating':
        return new IncProps(spec.label, atk.mwx, xspan(1, 9), numHandler('mwx'));
      case 'piercing':
        return new IncProps(spec.label, atk.apx, xspan(1, 4), numHandler('apx'));
      case 'piercingCrits':
        return new IncProps(spec.label, atk.px, xspan(1, 4), numHandler('px'));
      case 'reroll':
        return new IncProps(spec.label, atk.reroll, preX(rerolls), textHandler('reroll'));
      case 'lethal':
        return new IncProps(spec.label, atk.lethal + '+', xspan(5, 2, '+'), numHandler('lethal'));
      case 'autoNorms':
        return new IncProps(spec.label, atk.autoNorms, xspan(1, 3), numHandler('autoNorms'));
      case 'autoCrits':
        return new IncProps(spec.label, atk.autoCrits, xspan(1, 9), numHandler('autoCrits'));
      case 'failsToNorms':
        return new IncProps(spec.label, atk.failsToNorms, xspan(1, 9), numHandler('failsToNorms'));
      case 'normsToCrits':
        return new IncProps(spec.label, atk.normsToCrits, xspan(1, 9), numHandler('normsToCrits'));
      case 'puritySeal':
        return new IncProps(spec.label, toYN(Ability.PuritySeal), xAndCheck, singleHandler(Ability.PuritySeal));
      default: {
        const unexpected: never = spec.id;
        throw new Error(`unknown attacker control '${unexpected}'`);
      }
    }
  }

  const { basicParams, advancedParams } = buildParams(attackerParamSpecs, buildParam);

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
