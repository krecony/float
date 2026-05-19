import NfcManager, { Ndef, NfcTech, type NdefRecord } from 'react-native-nfc-manager';
import type { NfcPaymentPayload } from '../types/nfc';

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

export async function readNfcPayload(): Promise<NfcPaymentPayload> {
  await NfcManager.requestTechnology(NfcTech.Ndef);

  const tag = await NfcManager.getTag();
  if (!tag?.ndefMessage?.length) {
    throw new Error('No NDEF message found on tag');
  }

  const record = tag.ndefMessage[0];
  if (!record?.payload) {
    throw new Error('Empty NDEF record');
  }

  const payloadBytes = record.payload as unknown as number[];

  // NDEF text record: byte 0 = status (encodes language code length)
  const statusByte = payloadBytes[0] ?? 0;
  const langCodeLen = statusByte & 0x3f;
  const textBytes = payloadBytes.slice(1 + langCodeLen);
  const text = String.fromCharCode(...textBytes);

  try {
    return JSON.parse(text) as NfcPaymentPayload;
  } catch {
    throw new Error(`Invalid JSON in NFC payload: ${text}`);
  }
}

export async function stopNfcRead(): Promise<void> {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // Ignore — already cancelled or not started
  }
}

/** Creates an NDEF message from a payload — used for demo tag writing if needed. */
export function encodeNdefPayload(payload: NfcPaymentPayload): NdefRecord[] {
  const json = JSON.stringify(payload);
  const record = Ndef.textRecord(json);
  return [record];
}
