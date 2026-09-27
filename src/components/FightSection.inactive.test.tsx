import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ShareProvider } from 'src/context/ShareContext';
import FightSection from 'src/components/FightSection';
import { calcRemainingWounds } from 'src/CalcEngineFight';

jest.mock('src/CalcEngineFight', () => ({
  __esModule: true,
  calcRemainingWounds: jest.fn(),
}));

const mockedCalcRemainingWounds = calcRemainingWounds as jest.MockedFunction<typeof calcRemainingWounds>;

beforeAll(() => {
  // recharts' ResponsiveContainer constructs ResizeObserver, which jsdom does not provide.
  (global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  mockedCalcRemainingWounds.mockReset();
  mockedCalcRemainingWounds.mockReturnValue([new Map(), new Map()]);
});

function fightTree(isActive: boolean) {
  return (
    <MemoryRouter>
      <ShareProvider>
        <FightSection isActive={isActive} />
      </ShareProvider>
    </MemoryRouter>
  );
}

it('runs the fight simulation only while the section is active', () => {
  const view = render(fightTree(false));
  expect(mockedCalcRemainingWounds).not.toHaveBeenCalled();

  view.rerender(fightTree(true));
  expect(mockedCalcRemainingWounds).toHaveBeenCalledTimes(1);
});
