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

// Both ids must exist and be different elements. A bare
// expect(a).not.toBe(b) passes when either lookup returns null.
function expectDistinctControls(idA: string, idB: string) {
  const a = document.getElementById(idA);
  const b = document.getElementById(idB);
  expect(a).not.toBeNull();
  expect(b).not.toBeNull();
  expect(a).not.toBe(b);
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
    expectDistinctControls('s1-atk-Attacks', 's2-atk-Attacks');
    expect(document.getElementById('s1-atk-Normal Dmg')).not.toBeNull();
    expectDistinctControls('s1-def-Wounds', 's2-def-Wounds');
    expectDistinctControls('s1-opt-Rounds', 's2-opt-Rounds');
    expectDistinctControls('fa-Attacks', 'fb-Attacks');
    expectDistinctControls('fa-Wounds', 's1-def-Wounds');
    expectDistinctControls('fo-Rounds', 's1-opt-Rounds');
    expect(document.getElementById('fo-Fighter A Strategy')).not.toBeNull();

    const fightAttacks = document.getElementById('fa-Attacks');
    expect(fight.contains(fightAttacks)).toBe(true);
    expect(shoot.contains(fightAttacks)).toBe(false);
    expect(fight.querySelector('label[for="fa-Attacks"]')?.getAttribute('for')).toBe('fa-Attacks');

    expect(shoot.querySelector('label[for="s1-atk-Attacks"]')).not.toBeNull();
    expect(shoot.querySelector('label[for="s2-atk-Attacks"]')).not.toBeNull();

    showAdvanced(container);
    assertLabelsPointAtTheirOwnSelect(container);
    expectDistinctControls('s1-atk-Reroll', 's1-def-Reroll');
    expectDistinctControls('s2-atk-FailsToNorms', 's2-def-FailsToNorms');
    expectDistinctControls('fa-FailsToNorms', 'fb-FailsToNorms');
    expectDistinctControls('s1-def-NormsToCrits', 'fa-NormsToCrits');
  });
});
