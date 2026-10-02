import React from "react";
import AdvancedMarker from "src/components/AdvancedMarker";
import 'src/components/Controls.css';

export function useCheckboxAndVariable(
  label: string,
  initialCheckedState: boolean = false,
  // when true, append the gear marker so this toggle matches the advanced controls it shows/hides
  advancedMarker: boolean = false,
  // when true, show only the gear; the label text stays for screen readers (narrow blocks)
  iconOnly: boolean = false,
) : [JSX.Element, boolean]
{
  const [checked, setChecked] = React.useState(initialCheckedState);
  return [
    // The input sits inside the label so the whole label toggles it.
    <label className='CheckItem' style={{ fontSize: '12px', color: '#4b5563', gap: '5px' }}>
      <input
        type='checkbox'
        checked={checked}
        onChange={() => setChecked(!checked)}
      />
      {iconOnly ? <span className='sr-only'>{label}</span> : label}
      {advancedMarker && <AdvancedMarker />}
    </label>,
    checked,
  ];
}
