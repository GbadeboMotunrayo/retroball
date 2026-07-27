// RetroBall TV — approved color system (PRD §5).
// Rule: ~95% of the interface stays dark. The wooden cabinet, amber dial and
// beige trim do the nostalgic work. Pure white is never used anywhere — it
// breaks the illusion instantly.

export const palette = {
  // Primary — TV cabinet, branding
  retroWalnut: '#4A3525',
  // Secondary — backgrounds, vintage plastic, presets
  crtBeige: '#E9DCC6',
  // Accent — dial, selected channel, active controls
  signalAmber: '#D9911E',
  // Success — connected stream, saved channel
  broadcastGreen: '#5F8D4E',
  // Danger — errors, broken links
  noSignalRed: '#B84343',
  // Screen — main display area (never true black)
  phosphorBlack: '#111214',
  // Static — loading/static animation
  tvStatic: '#8E949A',
  // Text — primary text on dark backgrounds
  tubeGlow: '#F7F5EF',
  // Shadow — depth and realism
  cabinetShadow: '#2A2019',

  // Supporting values called out in the PRD prose
  textSecondary: '#CBBEA8',
  textDisabled: '#8A8478',
  // Reserved for boot animation and scan-line effects ONLY. Never a UI color.
  phosphorGlow: '#C9FFD2',
};

// Derived cabinet tones, so the wood reads as a moulded object rather than a
// flat brown rectangle. All are shades of retroWalnut / cabinetShadow.
export const cabinet = {
  highlight: '#63472F',
  face: palette.retroWalnut,
  lowlight: '#3A2A1D',
  groove: palette.cabinetShadow,
  trim: '#D8C8AE',
};

export default palette;
