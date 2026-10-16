import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, fonts } from '../../../lib/theme';

const icon = (name) =>
  function TabIcon({ color, focused }) {
    return <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />;
  };

export default function ProTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.sageDark },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 21 },
        tabBarActiveTintColor: colors.sageDark,
        tabBarInactiveTintColor: '#9A958D',
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.creamDark },
        sceneStyle: { backgroundColor: colors.warmWhite },
      }}
    >
      <Tabs.Screen name="application" options={{ title: 'My application', tabBarLabel: 'Application', tabBarIcon: icon('document-text') }} />
      <Tabs.Screen name="inbox" options={{ title: 'Requests', tabBarIcon: icon('mail') }} />
      <Tabs.Screen name="pro-profile" options={{ title: 'My profile', tabBarLabel: 'Profile', tabBarIcon: icon('person') }} />
      <Tabs.Screen name="pro-settings" options={{ title: 'Settings', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
