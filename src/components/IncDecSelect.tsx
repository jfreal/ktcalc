import React from 'react';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import * as Util from 'src/Util';
import Note from 'src/Notes';
import { Col, Row } from 'react-bootstrap';
import AdvancedMarker from 'src/components/AdvancedMarker';

export interface IProps {
  id: string;
  hoverText?: string;
  label?: string;
  values: string[];
  selectedValue: number | string;
  valueChangeHandler: Util.Accepter<string>;
  // true when this control only appears under the panel's "Advanced" checkbox; shows the gear marker.
  advanced?: boolean;
}

export class Props implements IProps {
  public id: string;
  public hoverText?: string;
  public selectedValue: number | string;
  public values: string[];
  public valueChangeHandler: Util.Accepter<string>;
  public advanced?: boolean;

  constructor(
    idOrNote: string | Note,
    selectedValue: string | number,
    values: string[] | number[],
    valueChangeHandler: Util.Accepter<string>,
  ) {
    if(idOrNote instanceof Note) {
      this.id = idOrNote.name;
      this.hoverText = idOrNote.description;
    }
    else {
      this.id = idOrNote;
    }

    this.values = values.map((val: any) => val.toString()) as string[];
    this.selectedValue = selectedValue.toString();
    this.valueChangeHandler = valueChangeHandler;
  }
}

const IncDecSelect: React.FC<IProps> = (props: IProps) => {
  let selectedText = props.selectedValue.toString();
  const options = props.values.map(x => <option key={x} value={x}>{x}</option>);

  function handleIncDec(delta: number) {
    const newIdx = Math.max(0, props.values.indexOf(selectedText)) + delta;
    if(newIdx >= 0 && newIdx < options.length) {
      props.valueChangeHandler(props.values[newIdx]);
    }
  }

  function handleUserSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    props.valueChangeHandler(event.target.value);
  }

  return (
    <div>
      <label
        htmlFor={props.id}
        title={props.hoverText}
        style={{ fontSize: '11px', display: 'inline', verticalAlign: 'middle' }}
      >
        {props.label ?? props.id}
        {props.advanced ? <AdvancedMarker /> : (props.hoverText ? '*' : '')}
      </label>
      <InputGroup className='mb-1' style={{flexWrap: 'nowrap'}}>
        <Button variant='danger' onClick={() => handleIncDec(-1)}>-</Button>
        <select
          name={props.id}
          id={props.id}
          value={selectedText}
          onChange={handleUserSelect}
          style={{maxWidth: '70px'}}
        >
          {options}
        </select>
        <Button variant='danger' onClick={() => handleIncDec(1)}>+</Button>
      </InputGroup>
    </div>
  );
}

export function propsToRow(props: Props): JSX.Element {
  return <Row key={props.id}><Col className='pr-0'><IncDecSelect {...props}/></Col></Row>;
}

export function propsToRows(props: Props[]): JSX.Element[] {
  return props.map(p => <Row key={p.id}><Col className='pr-0'><IncDecSelect {...p}/></Col></Row>);
}

export default IncDecSelect;