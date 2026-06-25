import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpgradeBuffNote from 'src/components/notes/UpgradeBuffNote';

// Smoke + content tests for the /notes/upgrade-buff explainer page. The engine behavior it
// documents (the seed/feed Rending cases) is covered in CalcEngineCommon.test.ts; these tests
// guard the page itself so the footer link / route does not silently break.
function renderNote() {
  return render(
    <MemoryRouter>
      <UpgradeBuffNote />
    </MemoryRouter>,
  );
}

describe('UpgradeBuffNote', () => {
  it('renders the heading and names the in-game abilities', () => {
    renderNote();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('Upgrade Buff');
    // getByText throws if the text is absent, so these assert the in-game names are documented.
    expect(screen.getByText(/No Kin Left Behind/)).toBeTruthy();
    expect(screen.getByText(/Mystic Scry/)).toBeTruthy();
  });

  it('documents both Rending cases: seed a crit when you have none, feed a norm when you do', () => {
    renderNote();
    expect(screen.getByText(/seed one so Rending can fire/i)).toBeTruthy();  // Case A: {0c,2n} -> {2c,0n}
    expect(screen.getByText(/feed Rending a norm instead/i)).toBeTruthy();   // Case B: {1c,1n,1f} -> {2c,1n}
  });

  it('links back to the calculator at the top and bottom', () => {
    renderNote();
    const backLinks = screen.getAllByRole('link', { name: /Back to calculator/i });
    expect(backLinks).toHaveLength(2);
    backLinks.forEach(link => expect(link.getAttribute('href')).toBe('/'));
  });
});
