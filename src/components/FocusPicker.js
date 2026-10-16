import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius, space } from '../lib/theme';
import { styles as ui } from './ui';

const EXCLUSIVE = 'prefer_not_to_say';
const OTHER = 'other';

// Choose as many reasons as apply. "Prefer not to say" clears the rest,
// and "Other" opens a short text box.
export default function FocusPicker({ choices, value = [], onChange, otherText = '', onOtherText, error, otherError }) {
  const options = choices.some((c) => c.value === OTHER) ? choices : [...choices, { value: OTHER, label: 'Other' }];

  function toggle(v) {
    if (value.includes(v)) return onChange(value.filter((x) => x !== v));
    if (v === EXCLUSIVE) return onChange([EXCLUSIVE]);
    onChange([...value.filter((x) => x !== EXCLUSIVE), v]);
  }

  return (
    <View style={{ marginBottom: space(5) }}>
      <Text style={ui.label}>What brings you to MindSpace?</Text>
      <Text style={s.hint}>Choose all that apply.</Text>
      <View style={{ gap: 8 }}>
        {options.map((c) => {
          const on = value.includes(c.value);
          return (
            <View key={c.value}>
              <Pressable
                onPress={() => toggle(c.value)}
                style={[s.row, on && s.rowOn]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <View style={[s.box, on && s.boxOn]}>
                  {on ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                </View>
                <Text style={[s.text, on && { color: colors.sageDark, fontFamily: fonts.medium }]}>{c.label}</Text>
              </Pressable>
              {c.value === OTHER && on ? (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    style={[ui.input, otherError && ui.inputError]}
                    value={otherText}
                    onChangeText={(t) => onOtherText(t.slice(0, 100))}
                    placeholder="Please specify"
                    placeholderTextColor="#A19C94"
                    autoFocus
                    accessibilityLabel="Other reason"
                  />
                  {otherError ? <Text style={ui.fieldError}>{otherError}</Text> : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {error ? <Text style={[ui.fieldError, { marginTop: 8 }]}>{error}</Text> : null}
    </View>
  );
}

export function validateFocus(reasons, otherText) {
  const e = {};
  if (!reasons.length) e.focus = 'Choose at least one reason.';
  if (reasons.includes(OTHER) && otherText.trim().length < 2) e.focus_other = 'Tell us a little about your other reason.';
  return e;
}

const s = StyleSheet.create({
  hint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.midGray, marginTop: -2, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowOn: { borderColor: colors.sage, backgroundColor: colors.sageWash },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.sage, borderColor: colors.sage },
  text: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, color: colors.charcoal },
});
