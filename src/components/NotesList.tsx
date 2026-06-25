import React from 'react';
import Note from 'src/Notes';
import * as T from 'src/theme';
import { advancedMarkerChar } from 'src/components/AdvancedMarker';

// The Notes panel is split into a "Basic" section and an "Advanced" section. The advanced section
// collects the rules whose control only appears once the per-panel "Advanced" checkbox is ticked, so
// they line up with the gear-marked controls. The set of advanced rules is passed in per calculator
// (Shoot and Fight hide different controls) and must be kept in sync with the basic/advanced split in
// the AttackerControls / DefenderControls / FighterControls components.

export interface NotesListProps {
  notes: Note[];
  // Subset of `notes` whose control only appears when "Advanced" is enabled.
  advancedNotes?: ReadonlySet<Note>;
  // Extra <li> items rendered before the ability notes (e.g. general notes).
  children?: React.ReactNode;
}

const sectionHeaderStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '13px',
  margin: '10px 0 4px',
};

// Each note renders as a plain block: bold name on top, description on the line below (no bullets).
function renderNotes(list: Note[]) {
  return list.map(note => (
    <div key={note.name} style={{ marginBottom: '8px' }}>
      <b>{note.name}</b>
      <div>{note.description}</div>
    </div>
  ));
}

const NotesList: React.FC<NotesListProps> = ({ notes, advancedNotes, children }) => {
  const advancedList = advancedNotes ? notes.filter(note => advancedNotes.has(note)) : [];
  const basicList = advancedNotes ? notes.filter(note => !advancedNotes.has(note)) : notes;
  const hasAdvanced = advancedList.length > 0;
  const hasBasic = basicList.length > 0 || !!children;

  // No advanced rules: render a single group (unchanged behavior).
  if (!hasAdvanced) {
    return (
      <>
        {children && <ul style={{ marginBottom: '8px' }}>{children}</ul>}
        {renderNotes(basicList)}
      </>
    );
  }

  return (
    <>
      {hasBasic &&
        <>
          <div style={{ ...sectionHeaderStyle, marginTop: 0 }}>Basic</div>
          {children && <ul style={{ marginBottom: '8px' }}>{children}</ul>}
          {renderNotes(basicList)}
        </>
      }
      <div style={{ ...sectionHeaderStyle, color: T.textMuted }}>
        <span aria-hidden="true">{advancedMarkerChar}</span> Advanced — only shown when the{' '}
        <b>Advanced</b> checkbox is ticked
      </div>
      {renderNotes(advancedList)}
    </>
  );
};

export default NotesList;
