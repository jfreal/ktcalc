import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import FightSection from 'src/components/FightSection';
import ShootSection from 'src/components/ShootSection';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;

// App keeps Shoot and Fight mounted and only toggles display. Labels resolve
// with getElementById, which returns the first match, including one inside
// display:none.
function renderCalculators() {
  return render(
    <>
      <div data-testid="shoot" style={{ display: 'none' }}>
        <ShootSection isActive={false} />
      </div>
      <div data-testid="fight" style={{ display: 'block' }}>
        <FightSection isActive={false} />
      </div>
    </>,
  );
}

function assertLabelsPointAtTheirOwnSelect(container: HTMLElement) {
  const selects = [...container.querySelectorAll('select')];
  const ids = selects.map(select => select.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);

  for (const label of container.querySelectorAll('label')) {
    const ownSelect = label.parentElement?.querySelector('select');
    if (!ownSelect) {
      continue;
    }
    expect(label.htmlFor).toBe(ownSelect.id);
    expect(document.getElementById(label.htmlFor)?.id).toBe(ownSelect.id);
    expect(label.textContent ?? '').not.toMatch(/^(s[12]-(atk|def|opt)|fa|fb|fo)-/);
  }
}

function showAdvanced(container: HTMLElement) {
  // The Advanced toggle is a react-bootstrap checkbox. Its label is a sibling
  // of the input and has no htmlFor, so click the input next to that label.
  const labels = [...container.querySelectorAll('label')].filter(label =>
    (label.textContent ?? '').trim().startsWith('Advanced'));
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    const input = label.parentElement?.querySelector('input[type="checkbox"]');
    if (!input) {
      throw new Error('Advanced label has no checkbox');
    }
    fireEvent.click(input);
  }
}

describe('mounted IncDecSelect ids', () => {
  it('keeps every label on its own select across both calculators', () => {
    const { container, getByTestId } = renderCalculators();
    assertLabelsPointAtTheirOwnSelect(container);

    const shoot = getByTestId('shoot');
    const fight = getByTestId('fight');
    expect(document.getElementById('s1-atk-Attacks')).not.toBeNull();
    expect(document.getElementById('s2-atk-Attacks')).not.toBe(document.getElementById('s1-atk-Attacks'));
    expect(document.getElementById('s1-atk-Normal Dmg')).not.toBeNull();
    expect(document.getElementById('s2-def-Wounds')).not.toBe(document.getElementById('s1-def-Wounds'));
    expect(document.getElementById('s1-opt-Rounds')).not.toBeNull();
    expect(document.getElementById('s2-opt-Rounds')).not.toBeNull();
    expect(document.getElementById('fa-Attacks')).not.toBeNull();
    expect(document.getElementById('fb-Attacks')).not.toBe(document.getElementById('fa-Attacks'));
    expect(document.getElementById('fa-Wounds')).not.toBe(document.getElementById('s1-def-Wounds'));
    expect(document.getElementById('fo-Rounds')).not.toBe(document.getElementById('s1-opt-Rounds'));
    expect(document.getElementById('fo-Fighter A Strategy')).not.toBeNull();

    const fightAttacks = document.getElementById('fa-Attacks');
    expect(fight.contains(fightAttacks)).toBe(true);
    expect(shoot.contains(fightAttacks)).toBe(false);
    expect(fight.querySelector('label[for="fa-Attacks"]')?.getAttribute('for')).toBe('fa-Attacks');

    const situation2Attacks = shoot.querySelector('label[for="s2-atk-Attacks"]');
    expect(document.getElementById(situation2Attacks?.getAttribute('for') ?? '')?.id).toBe('s2-atk-Attacks');
    expect(shoot.querySelector('label[for="s1-atk-Attacks"]')?.getAttribute('for')).not.toBe(
      situation2Attacks?.getAttribute('for'),
    );

    showAdvanced(container);
    assertLabelsPointAtTheirOwnSelect(container);
    expect(document.getElementById('s1-atk-Reroll')).not.toBe(document.getElementById('s1-def-Reroll'));
    expect(document.getElementById('s1-def-Reroll')).not.toBeNull();
    expect(document.getElementById('s2-atk-FailsToNorms')).not.toBe(document.getElementById('s2-def-FailsToNorms'));
    expect(document.getElementById('fa-FailsToNorms')).not.toBe(document.getElementById('fb-FailsToNorms'));
    expect(document.getElementById('s1-def-NormsToCrits')).not.toBe(document.getElementById('fa-NormsToCrits'));
  });
});
