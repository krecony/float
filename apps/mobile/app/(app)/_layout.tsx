import { Tabs } from 'expo-router';
import { GroupDataProvider, useGroupData } from '../../src/providers/GroupDataProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme';

function TabNavigator() {
  const { activeGroupId } = useAuth();
  const { pendingCount } = useGroupData();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="group" options={{ title: 'Group' }} />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarBadge: activeGroupId && pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen name="members" options={{ title: 'Members' }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
    </Tabs>
  );
}

export default function AppLayout() {
  return (
    <GroupDataProvider>
      <TabNavigator />
    </GroupDataProvider>
  );
}
