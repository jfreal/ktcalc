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
  makeSetChangeHandler,
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
import { useCheckboxAndVariable } from 'src/hooks/useCheckboxAndVariable';

export interface Props {
  attacker: Model;
  changeHandler: Accepter<Model>;
}

const AttackerControls: React.FC<Props> = (props: Props) => {
  const atk = props.attacker;
  const textHandler = makeTextChangeHandler(atk, props.changeHandler);
  const numHandler = makeNumChangeHandler(atk, props.changeHandler);
  const [advancedCheckbox, wantShowAdvanced] = useCheckboxAndVariable('Advanced');
  //const noCoverChoices = Object.values(NoCoverType);

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

  function toYN(ability: Ability) {
    return boolToCheckX(atk.has(ability));
  }

  const basicParams: IncProps[] = [
    //           id/label,       selectedValue,         values,                valueChangeHandler
    new IncProps('Attacks',      atk.numDice,           span(1, 9),       numHandler('numDice')),
    new IncProps('BS',           atk.diceStat + '+',    rollSpan,         numHandler('diceStat')),
    new IncProps('Normal Dmg',   atk.normDmg,           span(0, 9),       numHandler('normDmg')),
    new IncProps('Crit Dmg',     atk.critDmg,           span(0, 10),      numHandler('critDmg')),
    new IncProps('Devastating',  atk.mwx,           xspan(1, 9),      numHandler('mwx')),
    new IncProps('Piercing',     atk.apx,           xspan(1, 4),      numHandler('apx')),
    new IncProps('PiercingCrits', atk.px,            xspan(1, 4),      numHandler('px')),
    new IncProps(N.Reroll,       atk.reroll,            preX(rerolls),    textHandler('reroll')),
    new IncProps('Lethal',       atk.lethal + '+',      xspan(5, 2, '+'), numHandler('lethal')),
    new IncProps(N.AutoNorms,    atk.autoNorms,         xspan(1, 9),      numHandler('autoNorms')),
  ];
  const advancedParams: IncProps[] = [
    new IncProps(N.ObscuredTarget, toYN(Ability.ObscuredTarget),          xAndCheck, singleHandler(Ability.ObscuredTarget)),
    new IncProps(N.AutoCrits,    atk.autoCrits,         xspan(1, 9),      numHandler('autoCrits')),
    new IncProps(N.FailsToNorms, atk.failsToNorms,      xspan(1, 9),      numHandler('failsToNorms')),
    new IncProps(N.NormsToCrits, atk.normsToCrits,      xspan(1, 9),      numHandler('normsToCrits')),
    new IncProps(N.PuritySeal, toYN(Ability.PuritySeal), xAndCheck, singleHandler(Ability.PuritySeal)),
    new IncProps(N.CloseAssault2021, toYN(Ability.FailToNormIfAtLeastTwoSuccesses), xAndCheck, singleHandler(Ability.FailToNormIfAtLeastTwoSuccesses)),
    //new IncProps(N.NoCover,      atk.noCover,            noCoverChoices,        textHandler('noCover')),
  ];

  const advancedParamsToShow
    = wantShowAdvanced
    ? advancedParams
    : advancedParams.filter(p => incDecPropsHasNondefaultSelectedValue(p));

  const [paramsCol0, paramsCol1] = requiredAndOptionalItemsToTwoCols(
    basicParams, advancedParamsToShow);

  const elemsCol0 = propsToRows(paramsCol0);
  const elemsCol1 = propsToRows(paramsCol1);

  const rendingCheckbox = (
    <Form.Check
      type="checkbox"
      label={N.Rending.name}
      title={N.Rending.description}
      checked={atk.has(Ability.Rending)}
      onChange={() => singleHandler(Ability.Rending)(atk.has(Ability.Rending) ? 'X' : '✔')}
    />
  );

  const severeCheckbox = (
    <Form.Check
      type="checkbox"
      label={N.Severe.name}
      title={N.Severe.description}
      checked={atk.has(Ability.Severe)}
      onChange={() => singleHandler(Ability.Severe)(atk.has(Ability.Severe) ? 'X' : '✔')}
    />
  );

  const punishingCheckbox = (
    <Form.Check
      type="checkbox"
      label="Punishing"
      title={N.Punishing.description}
      checked={atk.has(Ability.Punishing)}
      onChange={() => singleHandler(Ability.Punishing)(atk.has(Ability.Punishing) ? 'X' : '✔')}
    />
  );

  return (
    <Container style={{width: '310px'}}>
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
        <Col>{rendingCheckbox}</Col>
        <Col>{severeCheckbox}</Col>
        <Col>{punishingCheckbox}</Col>
      </Row>
    </Container>
  );
}

export default AttackerControls;