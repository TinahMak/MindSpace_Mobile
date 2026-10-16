import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, fonts } from '../../../lib/theme';

const icon = (name) =>
  function TabIcon({ color, focused }) {
    return <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sageDark,
        tabBarInactiveTintColor: '#9A958D',
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.creamDark },
        sceneStyle: { backgroundColor: colors.warmWhite },
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today', tabBarIcon: icon('sunny') }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarIcon: icon('chatbubble-ellipses') }} />
      <Tabs.Screen name="tools" options={{ title: 'Tools', tabBarIcon: icon('leaf') }} />
      <Tabs.Screen name="find-support" options={{ title: 'Support', tabBarIcon: icon('people') }} />
      <Tabs.Screen name="account" options={{ title: 'Me', tabBarIcon: icon('person-circle') }} />
    </Tabs>
  );
}
