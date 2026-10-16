import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '../lib/theme';

export const CONSULT_STATUS = {
  requested: [colors.cream, colors.charcoal, 'Waiting for a quote'],
  quoted: [colors.terraWash, colors.terra, 'Quote received'],
  accepted: [colors.sageWash, colors.sageDark, 'Accepted'],
  declined: [colors.creamDark, colors.midGray, 'Quote declined'],
  pro_declined: [colors.creamDark, colors.midGray, 'Declined by professional'],
  cancelled: [colors.creamDark, colors.midGray, 'Cancelled'],
  expired: [colors.creamDark, colors.midGray, 'Quote expired'],
};

export function StatusTag({ status, label }) {
  const [bg, fg, text] = CONSULT_STATUS[status] || [colors.cream, colors.charcoal, status];
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillText, { color: fg }]}>{label || text}</Text>
    </View>
  );
}

// Session times are stored as ISO date-times; older quotes may be plain text.
export function fmtSlot(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime()) || !/^\d{4}-\d{2}-\d{2}T/.test(v)) return v;
  return d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function slotPassed(v) {
  const d = new Date(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(v || '') && !Number.isNaN(d.getTime()) && d <= new Date();
}

export function fmtDate(d) {
  if (!d) return '';
  const x = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  return x.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

const s = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontFamily: fonts.medium, fontSize: 12 },
});
