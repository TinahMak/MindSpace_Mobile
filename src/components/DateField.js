import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { colors, fonts, radius, space } from '../lib/theme';
import { Button, styles as ui } from './ui';

export function fmtDate(d) {
  return d ? d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}
export function fmtDateTime(d) {
  return d ? d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
}

// iOS shows the picker in a small sheet; Android uses its native dialogs.
function IOSPicker({ visible, value, mode, minimumDate, maximumDate, onDone, onCancel }) {
  const [temp, setTemp] = useState(value);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,44,44,0.35)' }}>
        <View style={{ backgroundColor: colors.warmWhite, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space(4) }}>
          <DateTimePicker value={temp || value} mode={mode} display="spinner" minimumDate={minimumDate} maximumDate={maximumDate} onChange={(_, d) => d && setTemp(d)} />
          <Button title="Done" onPress={() => onDone(temp || value)} />
          <Button title="Cancel" variant="ghost" onPress={onCancel} style={{ marginTop: 4 }} />
        </View>
      </View>
    </Modal>
  );
}

/** A date (mode="date") or date-and-time (mode="datetime") field. value is a Date or null. */
export default function DateField({ label, value, onChange, mode = 'date', minimumDate, maximumDate, placeholder, error, hint, initial }) {
  const [iosOpen, setIosOpen] = useState(false);
  const start = value || initial || minimumDate || maximumDate || new Date();

  function open() {
    if (Platform.OS !== 'android') return setIosOpen(true);
    DateTimePickerAndroid.open({
      value: start,
      mode: 'date',
      minimumDate,
      maximumDate,
      onChange: (ev, d) => {
        if (ev.type !== 'set' || !d) return;
        if (mode !== 'datetime') return onChange(d);
        DateTimePickerAndroid.open({
          value: d,
          mode: 'time',
          is24Hour: true,
          onChange: (ev2, t) => {
            if (ev2.type !== 'set' || !t) return;
            const combined = new Date(d);
            combined.setHours(t.getHours(), t.getMinutes(), 0, 0);
            onChange(combined);
          },
        });
      },
    });
  }

  return (
    <View style={{ marginBottom: space(4) }}>
      {label ? <Text style={ui.label}>{label}</Text> : null}
      <Pressable onPress={open} style={[ui.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, error && ui.inputError]} accessibilityRole="button" accessibilityLabel={label || placeholder}>
        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: value ? colors.charcoal : '#A19C94' }}>
          {value ? (mode === 'datetime' ? fmtDateTime(value) : fmtDate(value)) : placeholder || 'Choose'}
        </Text>
        <Ionicons name={mode === 'datetime' ? 'time-outline' : 'calendar-outline'} size={18} color={colors.midGray} />
      </Pressable>
      {error ? <Text style={ui.fieldError}>{error}</Text> : hint ? <Text style={[ui.small, { marginTop: 5 }]}>{hint}</Text> : null}
      {Platform.OS !== 'android' ? (
        <IOSPicker
          visible={iosOpen}
          value={start}
          mode={mode}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onDone={(d) => { setIosOpen(false); onChange(d); }}
          onCancel={() => setIosOpen(false)}
        />
      ) : null}
    </View>
  );
}
