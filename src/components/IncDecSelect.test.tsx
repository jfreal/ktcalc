import React from 'react';
import { render, within } from '@testing-library/react';
import IncDecSelect, { IProps } from 'src/components/IncDecSelect';

function renderSelect(extra: Partial<IProps>) {
  render(
    <IncDecSelect
      id="Thing"
      values={['0', '1']}
      selectedValue="0"
      valueChangeHandler={() => {}}
      {...extra}
    />,
  );
  return document.querySelector('label')!;
}

describe('IncDecSelect label marker', () => {
  it('shows the gear (and no star) for an advanced param', () => {
    const label = renderSelect({ advanced: true, hoverText: 'some note' });
    expect(within(label).queryByLabelText('advanced option')).not.toBeNull();
    expect(label.textContent).not.toContain('*');
  });

  it('shows a star (and no gear) for a basic note-backed param', () => {
    const label = renderSelect({ hoverText: 'some note' });
    expect(within(label).queryByLabelText('advanced option')).toBeNull();
    expect(label.textContent).toContain('*');
  });

  it('shows no marker for a basic param without a note', () => {
    const label = renderSelect({});
    expect(within(label).queryByLabelText('advanced option')).toBeNull();
    expect(label.textContent).not.toContain('*');
  });
});
