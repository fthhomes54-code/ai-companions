import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export type CompanionInput = {
  name: string;
  personality?: string;
  backstory?: string;
  tone?: string;
  exampleLines?: string;
};

export function buildSystemPrompt(input: CompanionInput): string {
  const parts: string[] = [];
  parts.push(`You are ${input.name}, an AI companion created by a user.`);
  if (input.personality) parts.push(`Personality: ${input.personality}`);
  if (input.backstory) parts.push(`Backstory: ${input.backstory}`);
  if (input.tone) parts.push(`Tone: ${input.tone}`);
  if (input.exampleLines) parts.push(`Example lines the user likes:\n${input.exampleLines}`);
  parts.push('Stay in character. Remember the conversation. Be warm, consistent, and engaging. Never break the fourth wall unless asked.');
  return parts.join('\n\n');
}

export async function chatWithCompanion(
  input: CompanionInput,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
) {
  const system = buildSystemPrompt(input);
  const messages = [
    { role: 'system' as const, content: system },
    ...history,
    { role: 'user' as const, content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: 0.8,
  });

  return completion.choices[0]?.message?.content ?? 'I\'m here for you.';
}