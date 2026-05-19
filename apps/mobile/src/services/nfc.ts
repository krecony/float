import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

export interface NfcPaymentPayload {
  payerId: string;
  cardToken: string;
  timestamp: number;
  groupId?: string;
}

export async function initNfc(): Promise<boolean> {
  try {
    const supported = await NfcManager.isSupported();
    if (supported) {
      await NfcManager.start();
    }
    return supported;
  } catch {
    return false;
  }
}

export async function writeNfcPayload(payload: NfcPaymentPayload): Promise<void> {
  await NfcManager.requestTechnology(NfcTech.Ndef);
  try {
    const json = JSON.stringify(payload);
    const bytes = Ndef.encodeMessage([Ndef.textRecord(json)]);
    if (!bytes) throw new Error('Failed to encode NDEF message');
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    await NfcManager.cancelTechnologyRequest();
  }
}

export async function stopNfcWrite(): Promise<void> {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // Ignore — already cancelled or not started
  }
}
