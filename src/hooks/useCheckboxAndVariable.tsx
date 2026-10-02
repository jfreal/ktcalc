import React from "react";
import { Form } from "react-bootstrap";
import AdvancedMarker from "src/components/AdvancedMarker";

export function useCheckboxAndVariable(
  label: string,
  initialCheckedState: boolean = false,
  // when true, append the gear marker so this toggle matches the advanced controls it shows/hides
  advancedMarker: boolean = false,
  // ties the label to the box so clicking the text toggles it; must be unique on the page
  id?: string,
) : [JSX.Element, boolean]
{
  const [checked, setChecked] = React.useState(initialCheckedState);
  return [
    <Form.Check
      id={id}
      label={advancedMarker ? <>{label} <AdvancedMarker /></> : label}
      checked={checked}
      onChange={() => setChecked(!checked)}
    />,
    checked,
  ];
}