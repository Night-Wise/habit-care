export type BundledRingSoundId =
  | 'funny'
  | 'dino'
  | 'clock'
  | 'eas'
  | 'stardust'
  | 'digital';
export type RingSoundId = BundledRingSoundId | 'device' | 'custom';

export interface RingtoneOption {
  id: RingSoundId;
  label: string;
  description: string;
  /** Bundled asset via require(); null for device/custom */
  asset?: number;
  /** Filename registered with expo-notifications plugin (bundled only) */
  notificationSoundName?: string;
}

export const BUNDLED_RINGTONES: RingtoneOption[] = [
  {
    id: 'funny',
    label: 'Funny',
    description: 'Playful alarm',
    asset: require('../../assets/ringtones/funny.mp3'),
    notificationSoundName: 'funny.mp3',
  },
  {
    id: 'dino',
    label: 'Dino',
    description: 'Bold alarm',
    asset: require('../../assets/ringtones/dino.mp3'),
    notificationSoundName: 'dino.mp3',
  },
  {
    id: 'clock',
    label: 'Clock',
    description: 'Classic clock',
    asset: require('../../assets/ringtones/clock.mp3'),
    notificationSoundName: 'clock.mp3',
  },
  {
    id: 'eas',
    label: 'EAS',
    description: 'Alert tone',
    asset: require('../../assets/ringtones/eas.mp3'),
    notificationSoundName: 'eas.mp3',
  },
  {
    id: 'stardust',
    label: 'Stardust',
    description: 'Soft alarm',
    asset: require('../../assets/ringtones/stardust.mp3'),
    notificationSoundName: 'stardust.mp3',
  },
  {
    id: 'digital',
    label: 'Digital',
    description: 'Digital beep',
    asset: require('../../assets/ringtones/digital.mp3'),
    notificationSoundName: 'digital.mp3',
  },
];

export const DEVICE_RINGTONE: RingtoneOption = {
  id: 'device',
  label: 'Device default',
  description: 'System alert sound',
};

export const CUSTOM_RINGTONE: RingtoneOption = {
  id: 'custom',
  label: 'Custom track',
  description: 'Pick mp3 / m4a / wav',
};

export const ALL_RINGTONE_OPTIONS: RingtoneOption[] = [
  ...BUNDLED_RINGTONES,
  DEVICE_RINGTONE,
  CUSTOM_RINGTONE,
];

export const DEFAULT_RING_SOUND_ID: BundledRingSoundId = 'clock';
export const RING_DELAY_MS = 30 * 60 * 1000;
export const RING_DURATION_MS = 60 * 1000;

export function isBundledRingSoundId(id: unknown): id is BundledRingSoundId {
  return BUNDLED_RINGTONES.some((r) => r.id === id);
}

export function normalizeRingSoundId(id: unknown): RingSoundId {
  if (id === 'device' || id === 'custom' || isBundledRingSoundId(id)) return id;
  return DEFAULT_RING_SOUND_ID;
}

export function getRingtoneOption(id: RingSoundId): RingtoneOption {
  return ALL_RINGTONE_OPTIONS.find((r) => r.id === id) ?? BUNDLED_RINGTONES[0];
}

/** Source for expo-audio playback */
export function resolveRingAudioSource(
  soundId: RingSoundId,
  customUri?: string | null
): number | string | null {
  if (soundId === 'custom' && customUri) return customUri;
  if (soundId === 'device') {
    // Fall back to a bundled tone for in-app looping (OS default isn't a file URI)
    return BUNDLED_RINGTONES[0].asset ?? null;
  }
  const bundled = BUNDLED_RINGTONES.find((r) => r.id === soundId);
  return bundled?.asset ?? BUNDLED_RINGTONES[0].asset ?? null;
}

export function getNotificationSoundValue(
  soundId: RingSoundId
): true | string {
  if (soundId === 'device' || soundId === 'custom') return true;
  const bundled = BUNDLED_RINGTONES.find((r) => r.id === soundId);
  return bundled?.notificationSoundName ?? true;
}

const AUDIO_EXT = /\.(mp3|m4a|wav)$/i;

export function isAllowedAudioFilename(name: string): boolean {
  return AUDIO_EXT.test(name.trim());
}
