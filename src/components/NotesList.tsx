import React from 'react';
import Note from 'src/Notes';
import * as T from 'src/theme';

// Several calculator controls only appear once the user ticks the per-panel "Advanced" checkbox, so
// the rules they enable are easy to miss. We mark those rules in the Notes list with a gear icon and
// explain it in a legend. The set of advanced rules is passed in per calculator (Shoot and Fight
// hide different controls) and must be kept in sync with the basic/advanced split in the
// AttackerControls / DefenderControls / FighterControls components.

const advancedMarker = '⚙️';
const advancedTooltip = 'Hidden until you tick the "Advanced" checkbox in the controls above.';

const AdvancedMarker: React.FC = () => (
  <span
    role="img"
    aria-label="advanced option"
    title={advancedTooltip}
    style={{ marginLeft: '4px', cursor: 'help' }}
  >
    {advancedMarker}
  </span>
);

export interface NotesListProps {
  notes: Note[];
  // Subset of `notes` whose control only appears when "Advanced" is enabled.
  advancedNotes?: ReadonlySet<Note>;
  // Extra <li> items rendered before the ability notes (e.g. general notes).
  children?: React.ReactNode;
}

const NotesList: React.FC<NotesListProps> = ({ notes, advancedNotes, children }) => {
  const hasAdvanced = !!advancedNotes && notes.some(note => advancedNotes.has(note));
  return (
    <>
      {hasAdvanced &&
        <div style={{ fontSize: '13px', color: T.textMuted, marginBottom: '6px' }}>
          <span aria-hidden="true">{advancedMarker}</span> = hidden until you tick the{' '}
          <b>Advanced</b> checkbox in the controls above.
        </div>
      }
      <ul style={{ marginBottom: 0 }}>
        {children}
        {notes.map(note => (
          <li key={note.name}>
            <b>{note.name}</b>
            {advancedNotes?.has(note) && <AdvancedMarker />}
            : {note.description}
          </li>
        ))}
      </ul>
    </>
  );
};

export default NotesList;
