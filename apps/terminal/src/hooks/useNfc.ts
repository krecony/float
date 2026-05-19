import { useCallback, useRef, useState } from 'react';
import { readNfcPayload, stopNfcRead } from '../services/nfc';
import type { NfcPaymentPayload } from '../types/nfc';

interface UseNfcResult {
  payload: NfcPaymentPayload | null;
  isScanning: boolean;
  error: string | null;
  startScan: () => Promise<NfcPaymentPayload | null>;
  cancelScan: () => Promise<void>;
}

export function useNfc(): UseNfcResult {
  const [payload, setPayload] = useState<NfcPaymentPayload | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const startScan = useCallback(async (): Promise<NfcPaymentPayload | null> => {
    cancelledRef.current = false;
    setIsScanning(true);
    setError(null);
    setPayload(null);

    try {
      const result = await readNfcPayload();
      if (cancelledRef.current) return null;
      setPayload(result);
      return result;
    } catch (e) {
      if (!cancelledRef.current) {
        const msg = e instanceof Error ? e.message : 'NFC read failed';
        setError(msg);
      }
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const cancelScan = useCallback(async () => {
    cancelledRef.current = true;
    await stopNfcRead();
    setIsScanning(false);
  }, []);

  return { payload, isScanning, error, startScan, cancelScan };
}
