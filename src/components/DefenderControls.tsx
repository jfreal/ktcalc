import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';

import {Props as IncProps, propsToRows} from 'src/components/IncDecSelect';
import Model from 'src/Model';
import Ability, {rerollAbilities as rerolls} from 'src/Ability';
import * as N from 'src/Notes';
import { MaxWounds, SaveRange } from 'src/KtMisc';
import {
  Accepter,
  boolToCheckX,
  incDecPropsHasNondefaultSelectedValue,
  makeNumChangeHandler,
  makeSetChangeHandlerForSingle,
  makeTextChangeHandler,
  preX,
  span,
  withPlus,
  xAndCheck,
  xspan,
} from 'src/Util';
import { useCheckboxAndVariable } from 'src/hooks/useCheckboxAndVariable';

export interface Props {
  defender: Model;
  changeHandler: Accepter<Model>;
}


const DefenderControls: React.FC<Props> = (props: Props) => {
  const def = props.defender;
  const textHandler = makeTextChangeHandler(props.defender, props.changeHandler);
  const numHandler = makeNumChangeHandler(props.defender, props.changeHandler);
  const [advancedCheckbox, wantShowAdvanced] = useCheckboxAndVariable('Advanced');

  function singleHandler(ability: Ability) {
    return makeSetChangeHandlerForSingle<Model,Ability>(
      def,
      props.changeHandler,
      'abilities',
      ability,
    );
  }

  function toYN(ability: Ability) {
    return boolToCheckX(def.has(ability));
  }

  const basicParams: IncProps[] = [
    //           id,               selectedValue,            values,           valueChangeHandler
    new IncProps('Save',           def.diceStat + '+',       withPlus(SaveRange), numHandler('diceStat')),
    new IncProps('Wounds',         def.wounds,               span(1, MaxWounds),      numHandler('wounds')),
    new IncProps(N.CoverNormSaves, def.autoNorms,            xspan(1, 3),      numHandler('autoNorms')),
  ];
  const advancedParams: IncProps[] = [
    new IncProps(N.CoverCritSaves, def.autoCrits,            xspan(1, 3),      numHandler('autoCrits')),
    new IncProps(N.NormsToCrits,   def.normsToCrits,         xspan(1, 9),      numHandler('normsToCrits')),
    new IncProps(N.FailsToNorms,   def.failsToNorms,         xspan(1, 9),      numHandler('failsToNorms')),
    new IncProps(N.Punishing, toYN(Ability.Punishing), xAndCheck, singleHandler(Ability.Punishing)),
    new IncProps(N.HardyX,         def.hardyx + '+',         xspan(5, 2, '+'), numHandler('hardyx')),
    new IncProps(N.FeelNoPain,     def.fnp + '+',            xspan(6, 2, '+'), numHandler('fnp')),
    new IncProps(N.Reroll,         def.reroll,               preX(rerolls),    textHandler('reroll')),
    new IncProps(N.Durable2021,        toYN(Ability.Durable),    xAndCheck,        singleHandler(Ability.Durable)),
  ];

  // we actually have 1 column when rendered, and order gets weird if we pretend we have 2
  const usedAdvancedParams = advancedParams.filter(p => incDecPropsHasNondefaultSelectedValue(p));
  const advancedParamsToShow = wantShowAdvanced ? advancedParams : usedAdvancedParams;
  const paramsToShow = basicParams.concat(advancedParamsToShow);
  const elemsCol0 = propsToRows(paramsToShow);

  const indomitusCheckbox = (
    <Form.Check
      type="checkbox"
      label={N.Indomitus.name}
      title={N.Indomitus.description}
      checked={def.has(Ability.Indomitus)}
      onChange={() => singleHandler(Ability.Indomitus)(def.has(Ability.Indomitus) ? 'X' : '✔')}
    />
  );

  const obscuredCheckbox = (
    <Form.Check
      type="checkbox"
      label="Obscured"
      title={N.ObscuredTarget.description}
      checked={def.has(Ability.ObscuredTarget)}
      onChange={() => singleHandler(Ability.ObscuredTarget)(def.has(Ability.ObscuredTarget) ? 'X' : '✔')}
    />
  );

  const justAScratchCheckbox = (
    <Form.Check
      type="checkbox"
      label="JaS (Crits)"
      title="Just a Scratch (JaS): Ignore damage from an attack die, preferring crits."
      checked={def.has(Ability.JustAScratch)}
      onChange={() => singleHandler(Ability.JustAScratch)(def.has(Ability.JustAScratch) ? 'X' : '✔')}
    />
  );

  const justAScratchNormsCheckbox = (
    <Form.Check
      type="checkbox"
      label="JaS (Normals)"
      title="Just a Scratch (JaS): Ignore damage from a normal hit only (cannot ignore crits)."
      checked={def.has(Ability.JustAScratchNorms)}
      onChange={() => singleHandler(Ability.JustAScratchNorms)(def.has(Ability.JustAScratchNorms) ? 'X' : '✔')}
    />
  );
  return (
    <Container fluid className="p-0">
      <Row>
        <Col>Defender</Col>
        <Col>{advancedCheckbox}</Col>
      </Row>
      <Row>
        <Col>
          <Container className='p-0' style={{width: 'fit-content'}}>
            {elemsCol0}
          </Container>
        </Col>
      </Row>
      <Row>
        <Col>{indomitusCheckbox}</Col>
        <Col>{obscuredCheckbox}</Col>
        <Col>{justAScratchCheckbox}</Col>
        <Col>{justAScratchNormsCheckbox}</Col>
      </Row>
    </Container>
  );
};

export default DefenderControls;
