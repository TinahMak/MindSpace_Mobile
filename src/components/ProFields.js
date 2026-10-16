import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius, space } from '../lib/theme';
import { checkPhone } from '../lib/validate';
import Select from './Select';
import { Chip, Field, styles as ui } from './ui';

/**
 * Professional profile fields, grouped into sections so the signup can show
 * one section per step and the edit screens can show them all.
 * value/onChange hold a flat object; errors is { field: message }.
 */
export default function ProFields({ meta, sections, value, onChange, errors = {} }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v });
  const toggleIn = (k, v) => {
    const cur = value[k] || [];
    set(k)(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  const show = (name) => sections.includes(name);
  const prof = meta.professions.find((p) => p.value === value.profession);

  return (
    <View>
      {show('profession') && (
        <>
          <Text style={ui.label}>Your profession</Text>
          <View style={{ gap: 8, marginBottom: space(4) }}>
            {meta.professions.map((p) => {
              const on = value.profession === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() => onChange({ ...value, profession: p.value, regulator: p.default_regulator || value.regulator || '' })}
                  style={[s.option, on && s.optionOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[s.optionText, on && { color: colors.sageDark, fontFamily: fonts.medium }]}>{p.label}</Text>
                  {on ? <Ionicons name="checkmark-circle" size={18} color={colors.sage} /> : null}
                </Pressable>
              );
            })}
          </View>
          {errors.profession ? <Text style={[ui.fieldError, { marginTop: -8, marginBottom: 12 }]}>{errors.profession}</Text> : null}

          <Text style={ui.label}>Registered with</Text>
          <View style={s.wrap}>
            {meta.regulators.map((r) => (
              <Chip
                key={r.value}
                label={r.value === 'OTHER' ? 'Other' : r.value}
                selected={value.regulator === r.value}
                onPress={() => set('regulator')(r.value)}
              />
            ))}
          </View>
          {prof?.default_regulator && value.regulator && value.regulator !== prof.default_regulator ? (
            <Text style={[ui.fieldError, { color: colors.terra }]}>
              {prof.label}s are usually registered with the {prof.default_regulator}.
            </Text>
          ) : null}
          {errors.regulator ? <Text style={ui.fieldError}>{errors.regulator}</Text> : null}
          <View style={{ height: space(4) }} />
          {value.regulator === 'OTHER' ? (
            <Field label="Name of your professional body" value={value.regulator_other || ''} onChangeText={set('regulator_other')} error={errors.regulator_other} />
          ) : null}
          <Field
            label="Registration number"
            value={value.registration_number || ''}
            onChangeText={set('registration_number')}
            placeholder="As it appears on your certificate"
            autoCapitalize="characters"
            error={errors.registration_number}
          />
          <Field
            label="Qualifications"
            value={value.qualifications || ''}
            onChangeText={set('qualifications')}
            placeholder="e.g. MA Clinical Psychology (University of Pretoria)"
            multiline
            error={errors.qualifications}
          />
          <Field
            label="Years of experience"
            value={String(value.years_experience ?? '')}
            onChangeText={(t) => set('years_experience')(t.replace(/\D/g, '').slice(0, 2))}
            keyboardType="number-pad"
            error={errors.years_experience}
          />
        </>
      )}

      {show('practice') && (
        <>
          <Field label="Practice name (optional)" value={value.practice_name || ''} onChangeText={set('practice_name')} />
          <Field label="Street address (optional)" value={value.address || ''} onChangeText={set('address')} />
          <Field label="City or town" value={value.city || ''} onChangeText={set('city')} error={errors.city} />
          <Select label="Province" value={value.province} options={meta.provinces} onChange={set('province')} placeholder="Choose your province" error={errors.province} />

          <Toggle label="In-person sessions" value={value.offers_in_person !== false} onChange={set('offers_in_person')} />
          <Toggle label="Online sessions" value={!!value.offers_online} onChange={set('offers_online')} />
          <Toggle label="Accepts medical aid" value={!!value.accepts_medical_aid} onChange={set('accepts_medical_aid')} />
          {errors.offers_online ? <Text style={ui.fieldError}>{errors.offers_online}</Text> : null}

          <Text style={[ui.label, { marginTop: space(4) }]}>Fee per session (rand, optional)</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Field
              style={{ flex: 1 }}
              value={String(value.fee_min ?? '')}
              onChangeText={(t) => set('fee_min')(t.replace(/\D/g, ''))}
              placeholder="From"
              keyboardType="number-pad"
              error={errors.fee_min}
            />
            <Field
              style={{ flex: 1 }}
              value={String(value.fee_max ?? '')}
              onChangeText={(t) => set('fee_max')(t.replace(/\D/g, ''))}
              placeholder="Up to"
              keyboardType="number-pad"
              error={errors.fee_max}
            />
          </View>
          <Field
            label="Practice phone (optional)"
            value={value.contact_phone || ''}
            onChangeText={set('contact_phone')}
            keyboardType="phone-pad"
            placeholder="e.g. 012 342 1180"
            error={errors.contact_phone}
          />
        </>
      )}

      {show('about') && (
        <>
          <Text style={ui.label}>Focus areas</Text>
          <Text style={s.hint}>Choose all you work with.</Text>
          <View style={s.wrap}>
            {meta.specialties.map((x) => (
              <Chip key={x.value} label={x.label} selected={(value.specialties || []).includes(x.value)} onPress={() => toggleIn('specialties', x.value)} />
            ))}
          </View>
          {errors.specialties ? <Text style={ui.fieldError}>{errors.specialties}</Text> : null}

          <Text style={[ui.label, { marginTop: space(5) }]}>Languages you consult in</Text>
          <View style={s.wrap}>
            {meta.languages.map((l) => (
              <Chip key={l} label={l} selected={(value.languages || []).includes(l)} onPress={() => toggleIn('languages', l)} />
            ))}
          </View>
          {errors.languages ? <Text style={ui.fieldError}>{errors.languages}</Text> : null}

          <Text style={[ui.label, { marginTop: space(5) }]}>Short bio (optional)</Text>
          <TextInput
            style={[ui.input, { minHeight: 100, textAlignVertical: 'top' }]}
            value={value.bio || ''}
            onChangeText={(t) => set('bio')(t.slice(0, 1500))}
            placeholder="How you work and who you help. Clients will see this later."
            placeholderTextColor="#A19C94"
            multiline
          />
          <View style={{ height: space(4) }} />
        </>
      )}
    </View>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <View style={s.toggle}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.charcoal }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.sage, false: colors.lightGray }} thumbColor={colors.white} />
    </View>
  );
}

// Client-side checks per section (the server checks everything again).
export function validatePro(v, sections) {
  const e = {};
  if (sections.includes('profession')) {
    if (!v.profession) e.profession = 'Choose your profession.';
    if (!v.regulator) e.regulator = "Choose the body you're registered with.";
    if (v.regulator === 'OTHER' && !(v.regulator_other || '').trim()) e.regulator_other = 'Name your professional body.';
    if (!(v.registration_number || '').trim()) e.registration_number = 'Registration number is required.';
    if (!(v.qualifications || '').trim()) e.qualifications = 'List your qualifications.';
  }
  if (sections.includes('practice')) {
    if (!(v.city || '').trim()) e.city = 'City or town is required.';
    if (!v.province) e.province = 'Choose your province.';
    if (v.offers_in_person === false && !v.offers_online) e.offers_online = 'Offer in-person sessions, online sessions, or both.';
    if (v.fee_min && v.fee_max && Number(v.fee_max) < Number(v.fee_min)) e.fee_max = "Can't be lower than the minimum.";
    const ph = checkPhone(v.contact_phone, 'ZA', { required: false });
    if (ph.error) e.contact_phone = ph.error;
  }
  if (sections.includes('about')) {
    if (!(v.specialties || []).length) e.specialties = 'Choose at least one focus area.';
    if (!(v.languages || []).length) e.languages = 'Choose at least one language.';
  }
  return e;
}

export function toPayload(v) {
  const n = (x) => (x === '' || x === undefined || x === null ? null : Number(x));
  return {
    ...v,
    years_experience: Number(v.years_experience || 0),
    fee_min: n(v.fee_min),
    fee_max: n(v.fee_max),
    offers_in_person: v.offers_in_person !== false,
    offers_online: !!v.offers_online,
    accepts_medical_aid: !!v.accepts_medical_aid,
  };
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontFamily: fonts.body, fontSize: 12.5, color: colors.midGray, marginTop: -2, marginBottom: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionOn: { borderColor: colors.sage, backgroundColor: colors.sageWash },
  optionText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.charcoal },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
});
