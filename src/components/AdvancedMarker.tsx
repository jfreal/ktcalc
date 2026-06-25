import React from 'react';

// Shared "advanced option" marker. Shown next to a rule in the Notes panels and next to the matching
// control (e.g. an advanced-only checkbox) so the two line up visually. A control/rule is "advanced"
// when it only appears once the per-panel "Advanced" checkbox is ticked.
export const advancedMarkerChar = '⚙️';
export const advancedMarkerTooltip = "Advanced option — only shown when the \"Advanced\" checkbox is ticked.";

const AdvancedMarker: React.FC = () => (
  <span
    role="img"
    aria-label="advanced option"
    title={advancedMarkerTooltip}
    style={{ marginLeft: '4px', cursor: 'help' }}
  >
    {advancedMarkerChar}
  </span>
);

export default AdvancedMarker;
