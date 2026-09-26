import Note from 'src/Notes';

// A control that carries a Notes-panel explanation. `advanced` means the control stays hidden
// until that panel's Advanced checkbox is ticked.
export interface NotedControl {
  note: Note;
  advanced: boolean;
}

export interface ParamSpec<Id extends string = string> {
  id: Id;
  advanced: boolean;
  note?: Note;
}

export function noteOf<Id extends string>(spec: ParamSpec<Id>): Note {
  if (!spec.note) {
    throw new Error(`control '${spec.id}' is missing its Note`);
  }
  return spec.note;
}

// Notes for the param specs that are backed by a Note, in spec order.
export function notedControlsFromParams<Id extends string>(specs: readonly ParamSpec<Id>[]): NotedControl[] {
  const out: NotedControl[] = [];
  for (const spec of specs) {
    if (spec.note) out.push({ note: spec.note, advanced: spec.advanced });
  }
  return out;
}

// One Notes entry per Note, in first-seen order. A rule that is also an always-visible control
// stays in the Basic section even if another panel hides the same rule behind Advanced.
export function notesFromControls(controls: readonly NotedControl[]): { notes: Note[]; advancedNotes: Set<Note> } {
  const notes: Note[] = [];
  const advancedNotes = new Set<Note>();
  const seen = new Set<Note>();
  for (const control of controls) {
    if (!seen.has(control.note)) {
      seen.add(control.note);
      notes.push(control.note);
      if (control.advanced) advancedNotes.add(control.note);
    } else if (!control.advanced) {
      advancedNotes.delete(control.note);
    }
  }
  return { notes, advancedNotes };
}
