// Same palette and typefaces as the MindSpace website (css/style.css).
export const colors = {
  sage: '#7A9E87',
  sageLight: '#B5CEBF',
  sageDark: '#4A6B57',
  sageWash: '#EEF4F0',
  cream: '#F8F4EE',
  creamDark: '#EDE8DE',
  warmWhite: '#FDFAF6',
  terra: '#C4714A',
  terraWash: '#FBEFE8',
  charcoal: '#2C2C2C',
  midGray: '#6B6B6B',
  lightGray: '#D4D0CA',
  error: '#C0392B',
  errorBg: '#FDF0EF',
  white: '#FFFFFF',
};

export const fonts = {
  display: 'DMSerifDisplay_400Regular',
  displayItalic: 'DMSerifDisplay_400Regular_Italic',
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
};

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

export const space = (n) => n * 4;

// Mood scale tints: low moods lean warm, high moods lean sage.
export const moodTint = {
  1: '#E9C7B6',
  2: '#F0DCCF',
  3: '#EDE8DE',
  4: '#D5E4DA',
  5: '#B5CEBF',
};
