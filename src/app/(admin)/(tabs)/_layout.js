import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, fonts } from '../../../lib/theme';

const icon = (name) =>
  function TabIcon({ color, focused }) {
    return <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />;
  };

export default function AdminTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.charcoal },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 21 },
        tabBarActiveTintColor: colors.sageDark,
        tabBarInactiveTintColor: '#9A958D',
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.creamDark },
        sceneStyle: { backgroundColor: colors.warmWhite },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: icon('grid') }} />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: icon('people') }} />
      <Tabs.Screen name="professionals" options={{ title: 'Professionals', tabBarLabel: 'Pros', tabBarIcon: icon('medkit') }} />
      <Tabs.Screen name="ratings" options={{ title: 'Ratings', tabBarIcon: icon('star') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
