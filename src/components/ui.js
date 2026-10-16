import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, space } from '../lib/theme';

export function Screen({ children, scroll = true, padded = true, style, edges = ['top'], refreshControl }) {
  const inner = padded ? { paddingHorizontal: space(5), paddingBottom: space(10) } : null;
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      {scroll ? (
        <KeyboardAwareScrollView
          contentContainerStyle={inner}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          bottomOffset={32}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Heading({ children, style }) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

export function Body({ children, muted, style, ...rest }) {
  return (
    <Text style={[styles.body, muted && { color: colors.midGray }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Small({ children, style }) {
  return <Text style={[styles.small, style]}>{children}</Text>;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }) {
  const v = buttonVariants[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        v.box,
        pressed && !off && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        off && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <View style={styles.buttonRow}>
          {icon ? <Ionicons name={icon} size={18} color={v.text.color} /> : null}
          <Text style={[styles.buttonText, v.text]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { box: { backgroundColor: colors.sage }, text: { color: colors.white } },
  dark: { box: { backgroundColor: colors.charcoal }, text: { color: colors.white } },
  outline: {
    box: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.lightGray },
    text: { color: colors.charcoal },
  },
  ghost: { box: { backgroundColor: 'transparent' }, text: { color: colors.sageDark } },
  danger: { box: { backgroundColor: colors.error }, text: { color: colors.white } },
  help: { box: { backgroundColor: colors.terra }, text: { color: colors.white } },
  light: {
    box: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' },
    text: { color: colors.white },
  },
};

export function Field({ label, error, hint, secure, right, style, ...input }) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={[{ marginBottom: space(4) }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View>
        <TextInput
          placeholderTextColor="#A19C94"
          style={[styles.input, error && styles.inputError, (secure || right) && { paddingRight: 48 }]}
          secureTextEntry={secure && hidden}
          {...input}
        />
        {secure ? (
          <Pressable
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((h) => !h)}
            style={styles.inputIcon}
            hitSlop={10}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.midGray} />
          </Pressable>
        ) : right ? (
          <View style={styles.inputIcon}>{right}</View>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Small style={{ marginTop: 5 }}>{hint}</Small> : null}
    </View>
  );
}

export function Card({ children, style, tone = 'white' }) {
  const bg = { white: colors.white, cream: colors.cream, sage: colors.sageWash, terra: colors.terraWash }[tone];
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export function Chip({ label, selected, onPress, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn, style]}
    >
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ tone = 'error', children, style }) {
  const t = {
    error: { bg: colors.errorBg, fg: colors.error, icon: 'alert-circle-outline' },
    success: { bg: colors.sageWash, fg: colors.sageDark, icon: 'checkmark-circle-outline' },
    info: { bg: colors.cream, fg: colors.charcoal, icon: 'information-circle-outline' },
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }, style]}>
      <Ionicons name={t.icon} size={18} color={t.fg} style={{ marginTop: 1 }} />
      <Text style={[styles.noticeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

export function Check({ checked, onChange, children, error }) {
  return (
    <View style={{ marginBottom: space(3) }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.checkRow}
      >
        <View style={[styles.box, checked && styles.boxOn, error && { borderColor: colors.error }]}>
          {checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
        </View>
        <Text style={styles.checkText}>{children}</Text>
      </Pressable>
      {error ? <Text style={[styles.fieldError, { marginLeft: 30 }]}>{error}</Text> : null}
    </View>
  );
}

export function Loading({ label }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.sage} />
      {label ? <Small style={{ marginTop: space(3) }}>{label}</Small> : null}
    </View>
  );
}

export function callNumber(number) {
  const digits = String(number).replace(/[^\d+]/g, '');
  Linking.openURL(`tel:${digits}`).catch(() => {});
}

export function CrisisBanner({ line, onMore }) {
  if (!line) return null;
  return (
    <View style={styles.crisis} accessibilityRole="alert">
      <View style={{ flex: 1 }}>
        <Text style={styles.crisisTitle}>You don't have to go through this alone</Text>
        <Text style={styles.crisisText}>
          {line.name} is free and confidential, {line.hours}.
        </Text>
      </View>
      <Pressable onPress={() => callNumber(line.number)} style={styles.crisisCall} accessibilityRole="button">
        <Ionicons name="call" size={16} color={colors.white} />
        <Text style={styles.crisisCallText}>{line.number}</Text>
      </Pressable>
      {onMore ? (
        <Pressable onPress={onMore} hitSlop={8} accessibilityLabel="More support options">
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.warmWhite },
  title: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: colors.charcoal },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.charcoal },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.charcoal },
  small: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.midGray },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.charcoal, marginBottom: 6 },
  input: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.charcoal,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: { borderColor: colors.error },
  inputIcon: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  fieldError: { fontFamily: fonts.body, fontSize: 12, color: colors.error, marginTop: 5 },
  button: {
    minHeight: 50,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { fontFamily: fonts.medium, fontSize: 15 },
  card: { borderRadius: radius.md, padding: space(5), borderWidth: 1, borderColor: colors.creamDark },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
  },
  chipOn: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.charcoal },
  notice: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: radius.sm, marginBottom: space(4) },
  noticeText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: colors.sage, borderColor: colors.sage },
  checkText: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.midGray },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space(10) },
  crisis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.terra,
    borderRadius: radius.md,
    padding: 14,
  },
  crisisTitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.white },
  crisisText: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  crisisCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  crisisCallText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.white },
});
