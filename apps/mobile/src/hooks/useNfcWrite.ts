import { useCallback, useEffect, useRef, useState } from 'react';
import { initNfc, stopNfcWrite, writeNfcPayload, type NfcPaymentPayload } from '../services/nfc';

export type NfcWriteState = 'idle' | 'writing' | 'success' | 'error' | 'unsupported';

export function useNfcWrite() {
  const [state, setState] = useState<NfcWriteState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const activeRef = useRef(false);

  useEffect(() => {
    initNfc().then((supported) => {
      if (!supported) setState('unsupported');
    });
  }, []);

  const startWrite = useCallback(async (payload: NfcPaymentPayload) => {
    activeRef.current = true;
    setState('writing');
    setErrorMsg('');
    try {
      await writeNfcPayload(payload);
      if (activeRef.current) setState('success');
    } catch (e) {
      if (activeRef.current) {
        setState('error');
        setErrorMsg(e instanceof Error ? e.message : 'NFC write failed');
      }
    }
  }, []);

  const cancel = useCallback(async () => {
    activeRef.current = false;
    setState('idle');
    await stopNfcWrite();
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setErrorMsg('');
  }, []);

  return { state, errorMsg, startWrite, cancel, reset };
}
