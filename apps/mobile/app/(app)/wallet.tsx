import { Redirect } from 'expo-router';

/** Wallet tab removed — group view shows the virtual card. */
export default function WalletRedirect() {
  return <Redirect href="/(app)/group" />;
}
