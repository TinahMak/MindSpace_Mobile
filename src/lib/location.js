import * as Location from 'expo-location';

/**
 * Asks for location only when the person taps "Near me".
 * Returns { lat, lng } rounded to ~1 km, or throws with a friendly message.
 */
export async function approximateLocation() {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) {
    throw new Error("Location is off for MindSpace. You can choose your province instead.");
  }
  let pos = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
  if (!pos) pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const round = (x) => Math.round(x * 100) / 100;
  return { lat: round(pos.coords.latitude), lng: round(pos.coords.longitude) };
}

// For professionals setting their practice location: full precision.
export async function preciseLocation() {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new Error('Allow location access for MindSpace in your phone settings.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}
