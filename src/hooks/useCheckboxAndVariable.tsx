import React from "react";
import { Form } from "react-bootstrap";
import AdvancedMarker from "src/components/AdvancedMarker";

export function useCheckboxAndVariable(
  label: string,
  initialCheckedState: boolean = false,
  // when true, append the gear marker so this toggle matches the advanced controls it shows/hides
  advancedMarker: boolean = false,
) : [JSX.Element, boolean]
{
  const [checked, setChecked] = React.useState(initialCheckedState);
  return [
    <Form.Check
      label={advancedMarker ? <>{label} <AdvancedMarker /></> : label}
      checked={checked}
      onChange={() => setChecked(!checked)}
    />,
    checked,
  ];
}