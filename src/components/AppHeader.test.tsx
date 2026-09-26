import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';

// Same rule as Layout: /fight is a calculator route; docs are not.
const NON_CALCULATOR_PATH_PREFIXES = ['/help', '/notes', '/rules'];

function Harness() {
  const location = useLocation();
  const onCalculator = !NON_CALCULATOR_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));
  return <>
    <AppHeader onCalculator={onCalculator} />
    <output data-testid="location">{location.pathname}{location.search}</output>
  </>;
}

describe.each(['/help', '/rules/fight', '/notes/punishing'])('navigation from %s', (path) => {
  it.each(['Shoot', 'Fight'])('opens the %s calculator', (view) => {
    render(<MemoryRouter initialEntries={[path]}><Harness /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: `Kill Team ${view} Calculator` }));
    const expected = view === 'Fight' ? '/fight' : `/?view=${view.toLowerCase()}`;
    expect(screen.getByTestId('location').textContent).toBe(expected);
    expect((screen.getByRole('button', { name: `Kill Team ${view} Calculator` }) as HTMLButtonElement).disabled).toBe(true);
  });
});

it('preserves shared parameters when switching calculator views', () => {
  render(<MemoryRouter initialEntries={['/?view=shoot&a1=4%3A3&fa=12%3A4']}><Harness /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Kill Team Fight Calculator' }));
  expect(screen.getByTestId('location').textContent).toBe('/fight?a1=4%3A3&fa=12%3A4');
  fireEvent.click(screen.getByRole('button', { name: 'Kill Team Shoot Calculator' }));
  expect(screen.getByTestId('location').textContent).toBe('/?view=shoot&a1=4%3A3&fa=12%3A4');
});
