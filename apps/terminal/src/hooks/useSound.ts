import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';

export function useSound() {
  const tapRef = useRef<Audio.Sound | null>(null);
  const approvalRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
    }).catch(() => {});

    Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../assets/sounds/tap.mp3') as Parameters<typeof Audio.Sound.createAsync>[0],
      { volume: 1.0 },
    )
      .then(({ sound }) => {
        tapRef.current = sound;
      })
      .catch(() => {});

    Audio.Sound.createAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../assets/sounds/approval.mp3') as Parameters<typeof Audio.Sound.createAsync>[0],
      { volume: 1.0 },
    )
      .then(({ sound }) => {
        approvalRef.current = sound;
      })
      .catch(() => {});

    return () => {
      tapRef.current?.unloadAsync().catch(() => {});
      approvalRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const playTapSound = useCallback(async () => {
    try {
      await tapRef.current?.setPositionAsync(0);
      await tapRef.current?.playAsync();
    } catch {
      // Sound not loaded yet — ignore
    }
  }, []);

  const playApprovalSound = useCallback(async () => {
    try {
      await approvalRef.current?.setPositionAsync(0);
      await approvalRef.current?.playAsync();
    } catch {
      // Sound not loaded yet — ignore
    }
  }, []);

  return { playTapSound, playApprovalSound };
}
