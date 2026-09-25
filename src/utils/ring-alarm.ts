import { Platform } from 'react-native';

import {
  RING_DURATION_MS,
  resolveRingAudioSource,
  type RingSoundId,
} from '@/utils/ringtones';

type AudioPlayer = {
  loop: boolean;
  volume: number;
  play: () => void;
  pause: () => void;
  remove: () => void;
  seekTo: (seconds: number) => void;
};

let player: AudioPlayer | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;
let AudioModule: typeof import('expo-audio') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AudioModule = require('expo-audio');
} catch {
  AudioModule = null;
}

function clearStopTimer() {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
}

export async function stopRingAlarm(): Promise<void> {
  clearStopTimer();
  if (!player) return;
  try {
    player.pause();
    player.remove();
  } catch (err) {
    console.warn('[RingAlarm] Failed to stop:', err);
  }
  player = null;
}

/**
 * Play the selected ringtone on loop, then auto-stop after ~1 minute.
 */
export async function startRingAlarm(
  soundId: RingSoundId,
  customUri?: string | null,
  durationMs: number = RING_DURATION_MS
): Promise<boolean> {
  await stopRingAlarm();

  const source = resolveRingAudioSource(soundId, customUri);
  if (!source || !AudioModule) {
    console.warn('[RingAlarm] No audio source or expo-audio unavailable');
    return false;
  }

  try {
    await AudioModule.setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: Platform.OS !== 'web',
      interruptionMode: 'doNotMix',
    });

    const next = AudioModule.createAudioPlayer(source);
    next.loop = true;
    next.volume = 1;
    next.play();
    player = next;

    stopTimer = setTimeout(() => {
      void stopRingAlarm();
    }, durationMs);

    return true;
  } catch (err) {
    console.warn('[RingAlarm] Failed to start:', err);
    await stopRingAlarm();
    return false;
  }
}

export function isRingAlarmPlaying(): boolean {
  return player != null;
}
