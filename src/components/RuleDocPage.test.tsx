import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RuleDocPage from 'src/components/RuleDocPage';

// react-markdown / remark-gfm are ESM and are not transformed by CRA's Jest, so
// stub them. The stub renders the raw children, which is enough to assert the
// fetched Markdown reached the renderer; Markdown->HTML rendering is exercised
// in the browser, not here.
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="md">{children}</div>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

// Smoke tests for the /rules/* pages. fetch is mocked so we exercise the
// loading -> ok and loading -> error transitions without hitting public/rules/.
function renderDoc(file = 'COMBAT_RULES.md') {
  return render(
    <MemoryRouter>
      <RuleDocPage file={file} />
    </MemoryRouter>,
  );
}

describe('RuleDocPage', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  it('fetches the doc and passes its content to the renderer', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('# Combat Rules'),
    }) as unknown as typeof fetch;

    renderDoc();
    const md = await screen.findByTestId('md');
    expect(md.textContent).toContain('# Combat Rules');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rules/COMBAT_RULES.md'),
      expect.anything(),
    );
  });

  it('shows an error message when the fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve(''),
    }) as unknown as typeof fetch;

    renderDoc('MISSING.md');
    await waitFor(() => expect(screen.getByText(/Could not load this document/i)).toBeTruthy());
  });

  it('always offers a back link to the help hub', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('# X'),
    }) as unknown as typeof fetch;

    renderDoc();
    const backLinks = await screen.findAllByRole('link', { name: /Back to How it works/i });
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    backLinks.forEach((link) => expect(link.getAttribute('href')).toBe('/help'));
  });
});
