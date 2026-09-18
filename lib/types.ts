export type CompanionInput = {
  name: string;
  age?: number | null;
  personality?: string;
  backstory?: string;
  tone?: string;
  exampleLines?: string;
  voiceStyle?: string;
};

export type CompanionRow = {
  id: string;
  owner_id: string;
  name: string;
  age: number | null;
  personality: string | null;
  backstory: string | null;
  tone: string | null;
  example_lines: string | null;
  voice_style: string | null;
  system_prompt: string;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
};

export type MessageRow = {
  id: number;
  companion_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modality: 'text' | 'voice' | 'image';
  media_url: string | null;
  created_at: string;
};

export type MemoryFact = {
  id: number;
  companion_id: string;
  user_id: string;
  fact: string;
  category: string | null;
  importance: number;
  created_at: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  modality?: 'text' | 'voice' | 'image';
  mediaUrl?: string | null;
};
