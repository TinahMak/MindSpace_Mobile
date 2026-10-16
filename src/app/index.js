import { Redirect } from 'expo-router';

import { useAuth } from '../lib/auth';
import { homeFor } from '../lib/home';

export default function Index() {
  const { token, user } = useAuth();
  return <Redirect href={token ? homeFor(user) : '/welcome'} />;
}
