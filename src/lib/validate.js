import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

// Same rules as the server (api/validators.py), so errors show before sending.
export const MIN_AGE = 16;

const EMAIL_RE = /^(?=.{6,254}$)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const NAME_RE = /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;

export function emailError(v) {
  const e = (v || '').trim();
  if (!e) return 'Enter your email address.';
  if (!EMAIL_RE.test(e) || e.includes('..')) return 'Enter a valid email address, like name@example.com.';
  return null;
}

export function nameError(v, label = 'Name') {
  const n = (v || '').trim().replace(/\s+/g, ' ');
  if (n.length < 2) return `${label} must be at least 2 characters.`;
  if (n.length > 60) return `${label} is too long.`;
  if (!NAME_RE.test(n)) return `${label} can only contain letters, spaces, hyphens and apostrophes.`;
  return null;
}

const COUNTRY_NAMES = { ZA: 'South African', US: 'US', GB: 'UK', CA: 'Canadian', AU: 'Australian', IN: 'Indian' };

/** Returns { error } or { e164 } for a phone typed for the given country code (ZA, GB, ... or OTHER). */
export function checkPhone(raw, country = 'ZA', { required = true } = {}) {
  const v = (raw || '').trim();
  if (!v) return required ? { error: 'Enter your phone number.' } : { e164: '' };
  const digits = v.replace(/\D/g, '');
  const core = digits.replace(/^0+/, '') || '0';
  if (digits.length < 7 || new Set(core).size <= 1) return { error: "That phone number isn't valid." };
  if ('01234567890123456789'.includes(digits) || '98765432109876543210'.includes(digits)) return { error: "That phone number isn't valid." };
  const region = COUNTRY_NAMES[country] ? country : undefined;
  if (!region && !v.startsWith('+')) return { error: 'Enter your number in international format, starting with + and your country code.' };
  const p = parsePhoneNumberFromString(v, region);
  if (!p || !p.isValid()) return { error: region ? `That isn't a valid ${COUNTRY_NAMES[region]} phone number.` : "That phone number isn't valid." };
  if (region && p.country && p.country !== region) return { error: "That number doesn't match the country you chose." };
  return { e164: p.number };
}

export function phoneHint(country) {
  return { ZA: 'e.g. 071 234 5678', GB: 'e.g. 07400 123456', US: 'e.g. (201) 555-0123', CA: 'e.g. (204) 555-0123', AU: 'e.g. 0412 345 678', IN: 'e.g. 081234 56789' }[country] || 'e.g. +27 71 234 5678';
}

export function ageOn(dob, today = new Date()) {
  let a = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) a--;
  return a;
}

export function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
