import React from 'react';
import {
  Col,
  Container,
  Row,
} from 'react-bootstrap';
import Form from 'react-bootstrap/Form';

import Ability, {
  mutuallyExclusiveFightAbilities as nicheAbilities,
  rerollAbilities as rerolls,
} from 'src/Ability';
import { MaxWounds } from 'src/KtMisc';
import Model from 'src/Model';
import * as N from 'src/Notes';
import {
  Accepter,
  extractFromSet,
  incDecPropsHasNondefaultSelectedValue,
  makeIncDecPropsFromLookup,
  makeNumChangeHandler,
  makeSetChangeHandler,
  makeSetChangeHandlerForSingle,
  makeTextChangeHandler,
  preX,
  requiredAndOptionalItemsToTwoCols,
  rollSpan,
  span,
  xspan,
} from 'src/Util';
import { relicModeToLabel } from 'src/SaintlyRelics';
import AdvancedMarker from 'src/components/AdvancedMarker';
import {
  AbilityCheckbox,
  NotedControl,
  ParamSpec,
  buildParams,
  notedControlsFromCheckboxes,
  notedControlsFromParams,
} from 'src/components/controlNotes';
import { Props as IncProps, propsToRows } from 'src/components/IncDecSelect';
import { useCheckboxAndVariable } from 'src/hooks/useCheckboxAndVariable';


export interface Props {
  attacker: Model;
  changeHandler: Accepter<Model>;
}

export type FighterParamId =
  | 'wounds'
  | 'attacks'
  | 'ws'
  | 'normDmg'
  | 'critDmg'
  | 'reroll'
  | 'lethal'
  | 'niche'
  | 'autoNorms'
  | 'normsToCrits'
  | 'failsToNorms'
  | 'fnp'
  | 'relics';

// Order is the control order (params, then checkboxes). The Fight notes panel is built from this
// same list, so a rule appears in Notes exactly when a fighter card has a control for it.
// Close Assault and Waaagh are values of the NicheAbility dropdown, not their own controls.
export const fighterParamSpecs: readonly ParamSpec<FighterParamId>[] = [
  { id: 'wounds', label: 'Wounds', advanced: false },
  { id: 'attacks', label: 'Attacks', advanced: false },
  { id: 'ws', label: 'WS', advanced: false },
  { id: 'normDmg', label: 'Normal Dmg', advanced: false },
  { id: 'critDmg', label: 'Critical Dmg', advanced: false },
  { id: 'reroll', label: N.Reroll, advanced: false },
  { id: 'lethal', label: 'Lethal', advanced: false },
  { id: 'niche', label: N.NicheAbility, advanced: true },
  { id: 'autoNorms', label: N.AutoNorms, advanced: true },
  { id: 'normsToCrits', label: N.NormsToCrits, advanced: true },
  { id: 'failsToNorms', label: N.FailsToNorms, advanced: true },
  { id: 'fnp', label: N.FeelNoPain, advanced: true },
  { id: 'relics', label: N.SaintlyRelics, advanced: true },
];

export const fighterBasicCheckboxes: readonly AbilityCheckbox[] = [
  { note: N.Rending, ability: Ability.Rending },
  { note: N.Severe, ability: Ability.Severe },
  { note: N.Brutal, ability: Ability.Brutal },
];

export const fighterAdvancedCheckboxes: readonly AbilityCheckbox[] = [
  { note: N.Shock, ability: Ability.Shock },
  { note: N.Punishing, ability: Ability.Punishing },
  { note: N.PuritySeal, ability: Ability.PuritySeal },
  { note: N.MysticScryBuff, ability: Ability.MysticScryBuff },
  { note: N.Duelist, ability: Ability.Duelist },
  { note: N.JustAScratch2021, ability: Ability.JustAScratch },
  { note: N.JustAScratchNorms, ability: Ability.JustAScratchNorms },
  { note: N.Durable2021, ability: Ability.Durable },
  { note: N.HalfDamageFirstStrike, ability: Ability.HalfDamageFirstStrike },
];

export const fighterNotedControls: readonly NotedControl[] = [
  ...notedControlsFromParams(fighterParamSpecs),
  ...notedControlsFromCheckboxes(fighterBasicCheckboxes, false),
  ...notedControlsFromCheckboxes(fighterAdvancedCheckboxes, true),
];

const FighterControls: React.FC<Props> = (props: Props) => {
  const atk = props.attacker;
  const textHandler = makeTextChangeHandler(atk, props.changeHandler);
  const numHandler = makeNumChangeHandler(atk, props.changeHandler);
  const [advancedCheckbox, wantShowAdvanced] = useCheckboxAndVariable('Advanced', false, true);

  function subsetHandler(subset: Iterable<Ability>) {
    return makeSetChangeHandler<Model,Ability>(
      atk,
      props.changeHandler,
      'abilities',
      subset,
    );
  }
  function singleHandler(ability: Ability) {
    return makeSetChangeHandlerForSingle<Model,Ability>(
      atk,
      props.changeHandler,
      'abilities',
      ability,
    );
  }

  const nicheAbility = extractFromSet(nicheAbilities, Ability.None, atk.abilities)!;

  function abilityCheckbox(box: AbilityCheckbox, advanced: boolean) {
    return (
      <Form.Check
        key={box.note.name}
        type="checkbox"
        label={advanced ? <>{box.note.name} <AdvancedMarker /></> : box.note.name}
        title={box.note.description}
        checked={atk.has(box.ability)}
        onChange={() => singleHandler(box.ability)(atk.has(box.ability) ? 'X' : '✔')}
      />
    );
  }

  function buildParam(spec: ParamSpec<FighterParamId>): IncProps {
    switch (spec.id) {
      case 'wounds':
        return new IncProps(spec.label, atk.wounds, span(1, MaxWounds), numHandler('wounds'));
      case 'attacks':
        return new IncProps(spec.label, atk.numDice, span(1, 8), numHandler('numDice'));
      case 'ws':
        return new IncProps(spec.label, atk.diceStat + '+', rollSpan, numHandler('diceStat'));
      case 'normDmg':
        return new IncProps(spec.label, atk.normDmg, span(1, 9), numHandler('normDmg'));
      case 'critDmg':
        return new IncProps(spec.label, atk.critDmg, span(1, 9), numHandler('critDmg'));
      case 'reroll':
        return new IncProps(spec.label, atk.reroll, preX(rerolls), textHandler('reroll'));
      case 'lethal':
        return new IncProps(spec.label, atk.lethal + '+', xspan(5, 2, '+'), numHandler('lethal'));
      case 'niche':
        return new IncProps(spec.label, nicheAbility, nicheAbilities, subsetHandler(nicheAbilities));
      case 'autoNorms':
        return new IncProps(spec.label, atk.autoNorms, xspan(1, 9), numHandler('autoNorms'));
      case 'normsToCrits':
        return new IncProps(spec.label, atk.normsToCrits, xspan(1, 9), numHandler('normsToCrits'));
      case 'failsToNorms':
        return new IncProps(spec.label, atk.failsToNorms, xspan(1, 9), numHandler('failsToNorms'));
      case 'fnp':
        return new IncProps(spec.label, atk.fnp + '+', xspan(6, 2, '+'), numHandler('fnp'));
      case 'relics':
        return makeIncDecPropsFromLookup(spec.label, atk, props.changeHandler, 'saintlyRelics', relicModeToLabel);
      default: {
        const unexpected: never = spec.id;
        throw new Error(`unknown fighter control '${unexpected}'`);
      }
    }
  }

  const { basicParams, advancedParams } = buildParams(fighterParamSpecs, buildParam);

  const advancedParamsToShow
    = wantShowAdvanced
    ? advancedParams
    : advancedParams.filter(p => incDecPropsHasNondefaultSelectedValue(p));

  const advancedCheckboxesToShow
    = wantShowAdvanced
    ? fighterAdvancedCheckboxes
    : fighterAdvancedCheckboxes.filter(c => atk.has(c.ability));

  const [paramsCol0, paramsCol1] = requiredAndOptionalItemsToTwoCols(
    basicParams, advancedParamsToShow);
  const elemsCol0 = propsToRows(paramsCol0);
  const elemsCol1 = propsToRows(paramsCol1);

  const allCheckboxes = [
    ...fighterBasicCheckboxes.map(box => ({ box, advanced: false })),
    ...advancedCheckboxesToShow.map(box => ({ box, advanced: true })),
  ];

  return (
    <Container style={{width: '310px'}}>
      <Row>
        <Col className='d-flex justify-content-end'>{advancedCheckbox}</Col>
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
        <Col>
          {allCheckboxes.filter((_, i) => i % 2 === 0).map(c => abilityCheckbox(c.box, c.advanced))}
        </Col>
        <Col>
          {allCheckboxes.filter((_, i) => i % 2 === 1).map(c => abilityCheckbox(c.box, c.advanced))}
        </Col>
      </Row>
    </Container>
  );
}

export default FighterControls;
