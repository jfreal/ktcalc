// GitHub heading anchors, matching github-slugger (what GitHub and the links in
// rules/*.md already use): lowercase, punctuation removed, spaces to hyphens.
// A repeated heading in the same document gets -1, -2, and so on.
//
// The character class is the ASCII punctuation GitHub strips (hyphen and
// underscore stay) plus the dashes and quotes that show up in these docs.
// Em dashes are deleted, not turned into a single hyphen, so
// "Scenario A — normal…" becomes scenario-a--normal-…

const GITHUB_HEADING_PUNCTUATION =
  // Control characters (\u0000-\u001F, \u007F) are part of the set GitHub strips.
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001F!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\u007F\u2010-\u2015\u2018-\u201F]/g;

export function githubHeadingSlug(value: string): string {
  return value.toLowerCase().replace(GITHUB_HEADING_PUNCTUATION, '').replace(/ /g, '-');
}

type PositionCache = { text: string; id: string };

// Assigns ids in document order. `position` is the heading's source offset:
// React Strict Mode renders twice, and a second call for the same position must
// return the id already chosen instead of consuming the next -1/-2 suffix.
export class HeadingSlugger {
  private used: { [slug: string]: number } = Object.create(null);
  private byPosition = new Map<string, PositionCache>();

  reset(): void {
    this.used = Object.create(null);
    this.byPosition.clear();
  }

  slug(value: string, position?: string | null): string {
    if (position) {
      const cached = this.byPosition.get(position);
      if (cached && cached.text === value) return cached.id;
    }
    const id = this.allocate(value);
    if (position) this.byPosition.set(position, { text: value, id });
    return id;
  }

  private allocate(value: string): string {
    const original = githubHeadingSlug(value);
    let result = original;
    while (Object.prototype.hasOwnProperty.call(this.used, result)) {
      this.used[original] = (this.used[original] ?? 0) + 1;
      result = `${original}-${this.used[original]}`;
    }
    this.used[result] = 0;
    return result;
  }
}
