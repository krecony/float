import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/providers/AuthProvider';
import { colors } from '../src/theme';

export default function Index() {
  const { session, profile, loading, groupsLoaded, userGroups, activeGroupId } = useAuth();

  if (loading || (session && !groupsLoaded)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile?.id_verified) return <Redirect href="/(onboarding)/verify-id" />;
  if (userGroups.length === 0) return <Redirect href="/(app)/group/join" />;
  if (!activeGroupId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href="/(app)/group" />;
}
