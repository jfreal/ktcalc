import fs from 'fs';
import path from 'path';

// public/llms.txt is crawler guidance. The mass view is an unfinished stub
// (empty ShootMassAnalysisSection, header button commented out), so this file
// must not send readers to /?view=mass.
const llmsTxt = fs.readFileSync(path.join(process.cwd(), 'public/llms.txt'), 'utf8');

describe('public/llms.txt', () => {
  it('does not link the unfinished mass analysis view', () => {
    expect(llmsTxt).not.toMatch(/\?view=mass\b/);
    expect(llmsTxt).not.toMatch(/mass matchup analysis/i);
    expect(llmsTxt).not.toMatch(/Mass analysis matrix/);
  });

  it('lists the live calculator views', () => {
    expect(llmsTxt).toContain('https://ktcalc.com/?view=shoot');
    expect(llmsTxt).toContain('https://ktcalc.com/?view=fight');
  });
});
