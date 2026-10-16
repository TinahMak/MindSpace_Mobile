import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, space } from '../lib/theme';
import { styles as ui } from './ui';

/**
 * A calm dropdown: shows the chosen option; tapping opens a sheet listing
 * every option. options: [{ value, label }] or plain strings.
 */
export default function Select({ label, value, options, onChange, placeholder = 'Choose', error, hint, allowClear, style }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const current = opts.find((o) => o.value === value);

  return (
    <View style={[{ marginBottom: space(4) }, style]}>
      {label ? <Text style={ui.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[ui.input, s.field, error && ui.inputError]}
        accessibilityRole="button"
        accessibilityLabel={`${label || placeholder}: ${current ? current.label : 'not chosen'}`}
      >
        <Text style={[s.value, !current && { color: '#A19C94' }]} numberOfLines={1}>{current ? current.label : placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.midGray} />
      </Pressable>
      {error ? <Text style={ui.fieldError}>{error}</Text> : hint ? <Text style={[ui.small, { marginTop: 5 }]}>{hint}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View style={[s.sheet, { paddingBottom: insets.bottom + space(3) }]}>
          <View style={s.grab} />
          {label ? <Text style={s.title}>{label}</Text> : null}
          <FlatList
            data={allowClear ? [{ value: null, label: 'None' }, ...opts] : opts}
            keyExtractor={(o) => String(o.value)}
            renderItem={({ item }) => {
              const on = item.value === value;
              return (
                <Pressable
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  style={({ pressed }) => [s.row, on && s.rowOn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[s.rowText, on && { color: colors.sageDark, fontFamily: fonts.medium }]}>{item.label}</Text>
                  {on ? <Ionicons name="checkmark" size={20} color={colors.sageDark} /> : null}
                </Pressable>
              );
            }}
            style={{ maxHeight: 420 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  value: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.charcoal },
  backdrop: { flex: 1, backgroundColor: 'rgba(44,44,44,0.35)' },
  sheet: { backgroundColor: colors.warmWhite, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingHorizontal: space(4), paddingTop: space(2) },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lightGray, marginBottom: space(3) },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.charcoal, marginBottom: space(2), marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.sm },
  rowOn: { backgroundColor: colors.sageWash },
  rowText: { fontFamily: fonts.body, fontSize: 15.5, color: colors.charcoal },
});
