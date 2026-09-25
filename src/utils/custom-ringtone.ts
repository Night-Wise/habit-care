import { Directory, File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

import { isAllowedAudioFilename } from '@/utils/ringtones';

/**
 * Let the user pick an mp3/m4a/wav and copy it into app documents.
 * Returns the stable file URI, or null if cancelled/invalid.
 */
export async function pickAndStoreCustomRingtone(todoId: string): Promise<{
  uri: string;
  name: string;
} | null> {
  if (Platform.OS === 'web') {
    // Web: use document picker; cache URI is enough for the session
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    const name = asset.name || 'custom.mp3';
    if (!isAllowedAudioFilename(name) && !isAllowedAudioFilename(asset.uri)) {
      throw new Error('Please choose an mp3, m4a, or wav file.');
    }
    return { uri: asset.uri, name };
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const name = asset.name || 'custom.wav';
  if (!isAllowedAudioFilename(name)) {
    throw new Error('Please choose an mp3, m4a, or wav file.');
  }

  const extMatch = name.match(/\.(mp3|m4a|wav)$/i);
  const ext = (extMatch?.[1] || 'mp3').toLowerCase();

  const dir = new Directory(Paths.document, 'ringtones');
  if (!dir.exists) {
    dir.create();
  }

  const dest = new File(dir, `${todoId}.${ext}`);
  if (dest.exists) {
    dest.delete();
  }

  const source = new File(asset.uri);
  await source.copy(dest);

  return { uri: dest.uri, name };
}
