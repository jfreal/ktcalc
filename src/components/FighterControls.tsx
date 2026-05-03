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
import Note, * as N from 'src/Notes';
import {
  Accepter,
  extractFromSet,
  incDecPropsHasNondefaultSelectedValue,
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
import { Props as IncProps, propsToRows } from 'src/components/IncDecSelect';
import { useCheckboxAndVariable } from 'src/hooks/useCheckboxAndVariable';


export interface Props {
  title: string;
  attacker: Model;
  changeHandler: Accepter<Model>;
}

const FighterControls: React.FC<Props> = (props: Props) => {
  const atk = props.attacker;
  const textHandler = makeTextChangeHandler(atk, props.changeHandler);
  const numHandler = makeNumChangeHandler(atk, props.changeHandler);
  const [advancedCheckbox, wantShowAdvanced] = useCheckboxAndVariable('Advanced');

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

  function abilityCheckbox(note: Note, ability: Ability) {
    return (
      <Form.Check
        key={note.name}
        type="checkbox"
        label={note.name}
        title={note.description}
        checked={atk.has(ability)}
        onChange={() => singleHandler(ability)(atk.has(ability) ? 'X' : '✔')}
      />
    );
  }

  const basicParams: IncProps[] = [
    //           id/label,           selectedValue,         values,           valueChangeHandler
    new IncProps('Wounds',           atk.wounds,            span(1, MaxWounds),      numHandler('wounds')),
    new IncProps('Attacks',          atk.numDice,           span(1, 8),       numHandler('numDice')),
    new IncProps('WS',               atk.diceStat + '+',    rollSpan,         numHandler('diceStat')),
    new IncProps('Normal Dmg',       atk.normDmg,           span(1, 9),       numHandler('normDmg')),
    new IncProps('Critical Dmg',     atk.critDmg,           span(1, 9),       numHandler('critDmg')),
    new IncProps(N.Reroll,           atk.reroll,            preX(rerolls),    textHandler('reroll')),
    new IncProps('Lethal',           atk.lethal + '+',      xspan(5, 2, '+'), numHandler('lethal')),
  ];

  const basicCheckboxes: { note: Note, ability: Ability }[] = [
    { note: N.Rending, ability: Ability.Rending },
    { note: N.Severe, ability: Ability.Severe },
    { note: N.Brutal, ability: Ability.Brutal },
  ];

  const advancedParams: IncProps[] = [
    new IncProps(N.NicheAbility,     nicheAbility,               nicheAbilities, subsetHandler(nicheAbilities)),
    new IncProps(N.AutoNorms,        atk.autoNorms,              xspan(1, 9),    numHandler('autoNorms')),
    new IncProps(N.NormsToCrits,     atk.normsToCrits,           xspan(1, 9),    numHandler('normsToCrits')),
    new IncProps(N.FailsToNorms,     atk.failsToNorms,           xspan(1, 9),    numHandler('failsToNorms')),
    new IncProps(N.FeelNoPain,       atk.fnp + '+',              xspan(6, 2, '+'), numHandler('fnp')),
  ];

  const advancedCheckboxes: { note: Note, ability: Ability }[] = [
    { note: N.Shock, ability: Ability.Shock },
    { note: N.Punishing, ability: Ability.Punishing },
    { note: N.PuritySeal, ability: Ability.PuritySeal },
    { note: N.Duelist, ability: Ability.Duelist },
    { note: N.JustAScratchCrits, ability: Ability.JustAScratch },
    { note: N.JustAScratchNorms, ability: Ability.JustAScratchNorms },
    { note: N.Durable2021, ability: Ability.Durable },
    { note: N.HalfDamageFirstStrike, ability: Ability.HalfDamageFirstStrike },
  ];

  const advancedParamsToShow
    = wantShowAdvanced
    ? advancedParams
    : advancedParams.filter(p => incDecPropsHasNondefaultSelectedValue(p));

  const advancedCheckboxesToShow
    = wantShowAdvanced
    ? advancedCheckboxes
    : advancedCheckboxes.filter(c => atk.has(c.ability));

  const [paramsCol0, paramsCol1] = requiredAndOptionalItemsToTwoCols(
    basicParams, advancedParamsToShow);
  const elemsCol0 = propsToRows(paramsCol0);
  const elemsCol1 = propsToRows(paramsCol1);

  const allCheckboxes = [...basicCheckboxes, ...advancedCheckboxesToShow];

  return (
    <Container style={{width: '310px'}}>
      <Row>
        <Col>{props.title}</Col>
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
        <Col>
          {allCheckboxes.filter((_, i) => i % 2 === 0).map(c => abilityCheckbox(c.note, c.ability))}
        </Col>
        <Col>
          {allCheckboxes.filter((_, i) => i % 2 === 1).map(c => abilityCheckbox(c.note, c.ability))}
        </Col>
      </Row>
    </Container>
  );
}

export default FighterControls;