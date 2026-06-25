import React from 'react';
import { render, screen, within } from '@testing-library/react';
import NotesList from 'src/components/NotesList';
import Note from 'src/Notes';

const alpha = new Note('Alpha', 'alpha desc');
const bravo = new Note('Bravo', 'bravo desc');
const charlie = new Note('Charlie', 'charlie desc');

describe('NotesList', () => {
  it('marks only the advanced notes and shows the legend', () => {
    render(<NotesList notes={[alpha, bravo, charlie]} advancedNotes={new Set([bravo])} />);

    // every note name renders
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Bravo')).toBeTruthy();
    expect(screen.getByText('Charlie')).toBeTruthy();

    // exactly one advanced marker, and it sits on the advanced note's row
    expect(screen.getAllByLabelText('advanced option')).toHaveLength(1);
    const bravoLi = screen.getByText('Bravo').closest('li')!;
    expect(within(bravoLi).queryByLabelText('advanced option')).not.toBeNull();
    const alphaLi = screen.getByText('Alpha').closest('li')!;
    expect(within(alphaLi).queryByLabelText('advanced option')).toBeNull();

    // legend explaining the marker is present
    expect(screen.getByText(/hidden until you tick/i)).toBeTruthy();
  });

  it('omits the legend and markers when nothing is advanced', () => {
    render(<NotesList notes={[alpha, bravo]} />);
    expect(screen.queryAllByLabelText('advanced option')).toHaveLength(0);
    expect(screen.queryByText(/hidden until you tick/i)).toBeNull();
  });

  it('renders leading children before the ability notes', () => {
    render(
      <NotesList notes={[alpha]} advancedNotes={new Set([alpha])}>
        <li>Lead item</li>
      </NotesList>,
    );
    expect(screen.getByText('Lead item')).toBeTruthy();
  });
});
