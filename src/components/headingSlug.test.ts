import { githubHeadingSlug, HeadingSlugger } from 'src/components/headingSlug';

describe('githubHeadingSlug', () => {
  // These are the fragments already written in rules/*.md. They match GitHub.
  it('matches the in-doc anchor links', () => {
    expect(githubHeadingSlug('Strike order: crit-first, except to deny a normal parry')).toBe(
      'strike-order-crit-first-except-to-deny-a-normal-parry',
    );
    expect(githubHeadingSlug('Reproducing this')).toBe('reproducing-this');
  });

  it('drops punctuation the way GitHub does, including em dashes', () => {
    expect(githubHeadingSlug('Just a Scratch (Crits)')).toBe('just-a-scratch-crits');
    expect(githubHeadingSlug('Lethal X+')).toBe('lethal-x');
    expect(githubHeadingSlug("Why the calculator doesn't decide this for you")).toBe(
      'why-the-calculator-doesnt-decide-this-for-you',
    );
    expect(githubHeadingSlug('Scenario A — normal parry cannot touch a crit')).toBe(
      'scenario-a--normal-parry-cannot-touch-a-crit',
    );
    expect(githubHeadingSlug('Scenario C — when order does not matter')).toBe(
      'scenario-c--when-order-does-not-matter',
    );
  });
});

describe('HeadingSlugger', () => {
  it('suffixes a repeated heading', () => {
    const slugger = new HeadingSlugger();
    expect(slugger.slug('Reroll Targeting Strategy')).toBe('reroll-targeting-strategy');
    expect(slugger.slug('No Double Reroll Rule')).toBe('no-double-reroll-rule');
    expect(slugger.slug('Reroll Targeting Strategy')).toBe('reroll-targeting-strategy-1');
    expect(slugger.slug('No Double Reroll Rule')).toBe('no-double-reroll-rule-1');
  });

  it('reuses the id when the same source position is slugged again', () => {
    const slugger = new HeadingSlugger();
    expect(slugger.slug('Reroll Targeting Strategy', '1')).toBe('reroll-targeting-strategy');
    // Strict Mode renders the component twice. The replay must not take -1.
    expect(slugger.slug('Reroll Targeting Strategy', '1')).toBe('reroll-targeting-strategy');
    expect(slugger.slug('Reroll Targeting Strategy', '2')).toBe('reroll-targeting-strategy-1');
    expect(slugger.slug('Reroll Targeting Strategy', '2')).toBe('reroll-targeting-strategy-1');
  });
});
