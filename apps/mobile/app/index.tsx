import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/providers/AuthProvider';
import { colors } from '../src/theme';

export default function Index() {
  const { session, profile, loading, activeGroupId } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile?.id_verified) return <Redirect href="/(onboarding)/verify-id" />;
  if (!activeGroupId) return <Redirect href="/(app)/group/join" />;

  return <Redirect href="/(app)/group" />;
}
