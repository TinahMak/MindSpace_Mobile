import { Alert } from 'react-native';

import { Body, Button, Card, Heading, Screen, Small } from '../../../components/ui';
import { useAuth } from '../../../lib/auth';
import { space } from '../../../lib/theme';

export default function ProSettings() {
  const { user, logout } = useAuth();
  return (
    <Screen edges={[]}>
      <Card style={{ marginTop: space(4) }}>
        <Heading style={{ fontSize: 20 }}>{`${user?.first_name || ''} ${user?.last_name || ''}`.trim()}</Heading>
        <Body muted>{user?.email}</Body>
        <Small style={{ marginTop: space(2) }}>Professional account</Small>
      </Card>
      <Small style={{ marginTop: space(4) }}>
        To change your password, log out and use "Forgot password?" on the log-in screen.
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
