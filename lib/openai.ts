import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return client;
}

export function getChatModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

export function getTtsModel(): string {
  return process.env.OPENAI_TTS_MODEL || 'tts-1';
}

export function getTtsVoice(): string {
  return process.env.OPENAI_TTS_VOICE || 'nova';
}

export function getWhisperModel(): string {
  return process.env.OPENAI_WHISPER_MODEL || 'whisper-1';
}

export function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL || 'dall-e-3';
}

export function isImageGenEnabled(): boolean {
  return process.env.ENABLE_IMAGE_GEN === 'true';
}
