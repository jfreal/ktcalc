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
  makeIncDecPropsFromLookup,
  makeNumChangeHandler,
  makeSetChangeHandlerForSingle,
  makeTextChangeHandler,
  preX,
  span,
  withPlus,
  xAndCheck,
  xspan,
} from 'src/Util';
import { relicModeToLabel } from 'src/SaintlyRelics';
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
  defender: Model;
  changeHandler: Accepter<Model>;
}

export type DefenderParamId =
  | 'save'
  | 'wounds'
  | 'coverNorms'
  | 'coverCrits'
  | 'normsToCrits'
  | 'failsToNorms'
  | 'punishing'
  | 'hardy'
  | 'fnp'
  | 'relics'
  | 'reroll';

export const defenderParamSpecs: readonly ParamSpec<DefenderParamId>[] = [
  { id: 'save', label: 'Save', advanced: false },
  { id: 'wounds', label: 'Wounds', advanced: false },
  { id: 'coverNorms', label: N.CoverNormSaves, advanced: false },
  { id: 'coverCrits', label: N.CoverCritSaves, advanced: true },
  { id: 'normsToCrits', label: N.NormsToCrits, advanced: true },
  { id: 'failsToNorms', label: N.FailsToNorms, advanced: true },
  { id: 'punishing', label: N.Punishing, advanced: true },
  { id: 'hardy', label: N.HardyX, advanced: true },
  { id: 'fnp', label: N.FeelNoPain, advanced: true },
  { id: 'relics', label: N.SaintlyRelics, advanced: true },
  { id: 'reroll', label: N.Reroll, advanced: true },
];

export const defenderBasicCheckboxes: readonly AbilityCheckbox[] = [
  { note: N.Indomitus, ability: Ability.Indomitus },
  { note: N.ObscuredTarget, ability: Ability.ObscuredTarget, label: 'Obscured' },
  { note: N.JustAScratch2021, ability: Ability.JustAScratch },
  { note: N.JustAScratchNorms, ability: Ability.JustAScratchNorms },
];

export const defenderNotedControls: readonly NotedControl[] = [
  ...notedControlsFromParams(defenderParamSpecs),
  ...notedControlsFromCheckboxes(defenderBasicCheckboxes, false),
];

const DefenderControls: React.FC<Props> = (props: Props) => {
  const def = props.defender;
  const textHandler = makeTextChangeHandler(props.defender, props.changeHandler);
  const numHandler = makeNumChangeHandler(props.defender, props.changeHandler);
  const [advancedCheckbox, wantShowAdvanced] = useCheckboxAndVariable('Advanced', false, true);

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

  function buildParam(spec: ParamSpec<DefenderParamId>): IncProps {
    switch (spec.id) {
      case 'save':
        return new IncProps(spec.label, def.diceStat + '+', withPlus(SaveRange), numHandler('diceStat'));
      case 'wounds':
        return new IncProps(spec.label, def.wounds, span(1, MaxWounds), numHandler('wounds'));
      case 'coverNorms':
        return new IncProps(spec.label, def.autoNorms, xspan(1, 3), numHandler('autoNorms'));
      case 'coverCrits':
        return new IncProps(spec.label, def.autoCrits, xspan(1, 3), numHandler('autoCrits'));
      case 'normsToCrits':
        return new IncProps(spec.label, def.normsToCrits, xspan(1, 9), numHandler('normsToCrits'));
      case 'failsToNorms':
        return new IncProps(spec.label, def.failsToNorms, xspan(1, 9), numHandler('failsToNorms'));
      case 'punishing':
        return new IncProps(spec.label, toYN(Ability.Punishing), xAndCheck, singleHandler(Ability.Punishing));
      case 'hardy':
        return new IncProps(spec.label, def.hardyx + '+', xspan(5, 2, '+'), numHandler('hardyx'));
      case 'fnp':
        return new IncProps(spec.label, def.fnp + '+', xspan(6, 4, '+'), numHandler('fnp'));
      case 'relics':
        return makeIncDecPropsFromLookup(spec.label, def, props.changeHandler, 'saintlyRelics', relicModeToLabel);
      case 'reroll':
        return new IncProps(spec.label, def.reroll, preX(rerolls), textHandler('reroll'));
      default: {
        const unexpected: never = spec.id;
        throw new Error(`unknown defender control '${unexpected}'`);
      }
    }
  }

  const { basicParams, advancedParams } = buildParams(defenderParamSpecs, buildParam);

  // we actually have 1 column when rendered, and order gets weird if we pretend we have 2
  const usedAdvancedParams = advancedParams.filter(p => incDecPropsHasNondefaultSelectedValue(p));
  const advancedParamsToShow = wantShowAdvanced ? advancedParams : usedAdvancedParams;
  const paramsToShow = basicParams.concat(advancedParamsToShow);
  const elemsCol0 = propsToRows(paramsToShow);

  return (
    <Container style={{width: '150px', maxWidth: '100%'}}>
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
        {defenderBasicCheckboxes.map(box => (
          <Col key={box.note.name}>
            <Form.Check
              type="checkbox"
              label={box.label ?? box.note.name}
              title={box.note.description}
              checked={def.has(box.ability)}
              onChange={() => singleHandler(box.ability)(def.has(box.ability) ? 'X' : '✔')}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default DefenderControls;
