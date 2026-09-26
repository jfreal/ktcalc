import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RuleDocPage, {
  HeadingSluggerProvider,
  MarkdownHeading,
  MarkdownLink,
} from 'src/components/RuleDocPage';
import { HeadingSlugger } from 'src/components/headingSlug';

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

  // The rules docs cross-link each other with absolute in-app paths. Those must render
  // as router links, or clicking one reloads the whole app instead of navigating.
  describe('MarkdownLink', () => {
    function renderLink(href?: string) {
      return render(
        <MemoryRouter>
          <MarkdownLink href={href}>text</MarkdownLink>
        </MemoryRouter>,
      );
    }

    it('renders an in-app path as a router link (no reload, no new tab)', () => {
      renderLink('/rules/retained-vs-modified');
      const a = screen.getByRole('link');
      expect(a.getAttribute('href')).toBe('/rules/retained-vs-modified');
      expect(a.getAttribute('target')).toBeNull();
    });

    it('renders an external link as a plain new-tab anchor', () => {
      renderLink('https://example.com/x');
      const a = screen.getByRole('link');
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    });

    it('treats protocol-relative URLs as external, not in-app', () => {
      renderLink('//example.com/x');
      expect(screen.getByRole('link').getAttribute('target')).toBeNull();
    });

    it('leaves an in-page hash as a plain anchor', () => {
      renderLink('#reproducing-this');
      const a = screen.getByRole('link');
      expect(a.getAttribute('href')).toBe('#reproducing-this');
      expect(a.getAttribute('target')).toBeNull();
    });
  });

  describe('MarkdownHeading', () => {
    function renderHeading(node: React.ReactElement) {
      return render(
        <HeadingSluggerProvider slugger={new HeadingSlugger()}>{node}</HeadingSluggerProvider>,
      );
    }

    it('sets the GitHub id used by the fight-rules strike-order link', () => {
      renderHeading(
        <MarkdownHeading level={2} node={{ position: { start: { offset: 0 } } }}>
          Strike order: crit-first, except to deny a normal parry
        </MarkdownHeading>,
      );
      expect(screen.getByRole('heading').id).toBe(
        'strike-order-crit-first-except-to-deny-a-normal-parry',
      );
    });

    it('slugs the visible text, ignoring emphasis', () => {
      renderHeading(
        <MarkdownHeading level={3} node={{ position: { start: { offset: 60 } } }}>
          Scenario C — when order does <strong>not</strong> matter
        </MarkdownHeading>,
      );
      expect(screen.getByRole('heading').id).toBe('scenario-c--when-order-does-not-matter');
    });

    it('keeps unique ids when Strict Mode renders each heading twice', () => {
      const slugger = new HeadingSlugger();
      render(
        <React.StrictMode>
          <HeadingSluggerProvider slugger={slugger}>
            <MarkdownHeading level={3} node={{ position: { start: { offset: 1 } } }}>
              Reroll Targeting Strategy
            </MarkdownHeading>
            <MarkdownHeading level={3} node={{ position: { start: { offset: 2 } } }}>
              Reroll Targeting Strategy
            </MarkdownHeading>
          </HeadingSluggerProvider>
        </React.StrictMode>,
      );
      const headings = screen.getAllByRole('heading');
      expect(headings.map((h) => h.id)).toEqual([
        'reroll-targeting-strategy',
        'reroll-targeting-strategy-1',
      ]);
    });
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
