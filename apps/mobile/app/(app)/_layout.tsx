import { Tabs } from 'expo-router';
import { usePendingApprovals } from '../../src/hooks/usePendingApprovals';
import { useAuth } from '../../src/providers/AuthProvider';
import { colors } from '../../src/theme';

export default function AppLayout() {
  const { activeGroupId } = useAuth();
  const { count } = usePendingApprovals(activeGroupId);

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
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen
        name="approvals"
        options={{ title: 'Approvals', tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tabs.Screen name="members" options={{ title: 'Members' }} />
    </Tabs>
  );
}
