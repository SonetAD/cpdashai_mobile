import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID;

export interface WordTiming {
  word: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
}

export interface ElevenLabsResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

/**
 * Convert character-level timestamps to word-level timestamps
 */
function convertToWordTimings(
  text: string,
  alignment: ElevenLabsResponse['alignment']
): WordTiming[] {
  const words = text.split(/\s+/);
  const wordTimings: WordTiming[] = [];

  let charIndex = 0;

  for (const word of words) {
    // Skip whitespace characters in alignment
    while (
      charIndex < alignment.characters.length &&
      alignment.characters[charIndex].trim() === ''
    ) {
      charIndex++;
    }

    if (charIndex >= alignment.characters.length) break;

    const wordStartTime = alignment.character_start_times_seconds[charIndex];
    let wordEndTime = wordStartTime;

    // Find all characters for this word
    for (let i = 0; i < word.length && charIndex < alignment.characters.length; i++) {
      wordEndTime = alignment.character_end_times_seconds[charIndex];
      charIndex++;
    }

    wordTimings.push({
      word,
      startTime: wordStartTime,
      endTime: wordEndTime,
    });
  }

  return wordTimings;
}

export interface SpeakOptions {
  text: string;
  voiceId?: string;
  onWordChange?: (wordIndex: number, word: string) => void;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

let currentSound: Audio.Sound | null = null;
let wordTimingInterval: NodeJS.Timeout | null = null;

/**
 * Stop any currently playing speech
 */
export async function stopSpeaking(): Promise<void> {
  if (wordTimingInterval) {
    clearInterval(wordTimingInterval);
    wordTimingInterval = null;
  }

  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (error) {
      console.log('Error stopping sound:', error);
    }
    currentSound = null;
  }
}

/**
 * Speak text using ElevenLabs API with word-level timing
 */
export async function speakWithElevenLabs(options: SpeakOptions): Promise<void> {
  const {
    text,
    voiceId = ELEVENLABS_VOICE_ID,
    onWordChange,
    onStart,
    onComplete,
    onError,
  } = options;

  // Stop any current speech
  await stopSpeaking();

  if (!ELEVENLABS_API_KEY) {
    const error = new Error('ElevenLabs API key not configured');
    onError?.(error);
    throw error;
  }

  try {
    console.log('Calling ElevenLabs API...');

    // Call ElevenLabs API with timestamps
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5', // Fast model for low latency
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data: ElevenLabsResponse = await response.json();
    console.log('ElevenLabs response received');

    // Convert character timestamps to word timestamps
    const wordTimings = convertToWordTimings(text, data.alignment);
    console.log('Word timings:', wordTimings.slice(0, 5)); // Log first 5 for debugging

    // Decode base64 audio and save to file
    const audioBase64 = data.audio_base64;
    const audioUri = FileSystem.cacheDirectory + 'elevenlabs_audio.mp3';
    await FileSystem.writeAsStringAsync(audioUri, audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Set up audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load and play audio
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: false }
    );
    currentSound = sound;

    // Set up word timing callback
    let currentWordIndex = -1;
    const startTime = Date.now();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;

      if (status.didJustFinish) {
        if (wordTimingInterval) {
          clearInterval(wordTimingInterval);
          wordTimingInterval = null;
        }
        onComplete?.();
        currentSound = null;
      }
    });

    // Start playing
    onStart?.();
    await sound.playAsync();

    // Update word highlights based on timing
    wordTimingInterval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;

      // Find current word based on elapsed time
      for (let i = 0; i < wordTimings.length; i++) {
        const timing = wordTimings[i];
        if (elapsedSeconds >= timing.startTime && elapsedSeconds < timing.endTime + 0.1) {
          if (i !== currentWordIndex) {
            currentWordIndex = i;
            onWordChange?.(i, timing.word);
          }
          break;
        }
      }

      // Check if all words have been spoken
      if (currentWordIndex >= wordTimings.length - 1) {
        const lastTiming = wordTimings[wordTimings.length - 1];
        if (elapsedSeconds > lastTiming.endTime + 0.5) {
          if (wordTimingInterval) {
            clearInterval(wordTimingInterval);
            wordTimingInterval = null;
          }
        }
      }
    }, 50); // Check every 50ms for smooth updates

  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return currentSound !== null;
}
