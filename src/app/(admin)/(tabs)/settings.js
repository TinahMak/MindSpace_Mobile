import { router } from 'expo-router';
import { Alert } from 'react-native';

import { Body, Button, Card, Heading, Screen, Small } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';
import { SITE_URL } from '../../../lib/config';
import { space } from '../../../lib/theme';

export default function AdminSettings() {
  const { user, logout } = useAuth();
  return (
    <Screen edges={[]}>
      <Card style={{ marginTop: space(4) }}>
        <Heading style={{ fontSize: 20 }}>{`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Admin'}</Heading>
        <Body muted>{user?.email}</Body>
        <Small style={{ marginTop: space(2) }}>Signed in as an admin.</Small>
      </Card>
      <Button title="Reports" icon="bar-chart-outline" variant="outline" onPress={() => router.push('/reports')} style={{ marginTop: space(4) }} />
      <Button title="Manage admins" icon="shield-checkmark-outline" variant="outline" onPress={() => router.push('/admins')} style={{ marginTop: space(4) }} />
      <Card tone="cream" style={{ marginTop: space(4) }}>
        <Body>The full admin panel, including the audit log, is also on the website:</Body>
        <Small style={{ marginTop: 4 }}>{SITE_URL}/panel/</Small>
      </Card>
      <Small style={{ marginTop: space(4) }}>
        For privacy, admins see activity counts only, never mood notes or chats.
      </Small>
      <Button
        title="Log out"
        variant="outline"
        style={{ marginTop: space(6) }}
        onPress={() => Alert.alert('Log out?', 'You can log back in any time.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', onPress: logout }])}
      />
    </Screen>
  );
}
