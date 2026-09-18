import { getChatModel, getOpenAI } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/prompt';
import type { ChatMessage, CompanionInput } from '@/lib/types';

export type { CompanionInput };
export { buildSystemPrompt };

export async function chatWithCompanion(
  input: CompanionInput,
  history: ChatMessage[],
  userMessage: string,
  opts?: {
    systemPromptOverride?: string;
    memoryFacts?: string[];
    userDisplayName?: string | null;
  }
): Promise<string> {
  const openai = getOpenAI();
  const system =
    opts?.systemPromptOverride ||
    buildSystemPrompt(input, {
      memoryFacts: opts?.memoryFacts,
      userDisplayName: opts?.userDisplayName,
    });

  const messages = [
    { role: 'system' as const, content: system },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: getChatModel(),
    messages,
    temperature: 0.85,
    presence_penalty: 0.3,
    frequency_penalty: 0.2,
  });

  return completion.choices[0]?.message?.content ?? "I'm here for you.";
}

export async function generateOutreachMessage(params: {
  companionName: string;
  systemPrompt: string;
  occasion: string;
  userDisplayName?: string | null;
  memoryFacts?: string[];
  timezone?: string;
}): Promise<string> {
  const openai = getOpenAI();
  const memories =
    params.memoryFacts && params.memoryFacts.length > 0
      ? params.memoryFacts.map((f) => `- ${f}`).join('\n')
      : '(no specific memories yet — still be personal and warm)';

  const completion = await openai.chat.completions.create({
    model: getChatModel(),
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: [
          params.systemPrompt,
          '',
          'You are writing a proactive check-in message to the user (they did not message you first).',
          'Make it feel spontaneous and personal — never like a holiday template or marketing blast.',
          '1–4 short sentences. Sign with your companion voice, not a corporate closer.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          `Occasion: ${params.occasion}`,
          `User name: ${params.userDisplayName || 'them'}`,
          `Timezone context: ${params.timezone || 'America/Chicago'}`,
          `Memories you can weave in:\n${memories}`,
          `Write as ${params.companionName} reaching out.`,
        ].join('\n\n'),
      },
    ],
  });

  return (
    completion.choices[0]?.message?.content ??
    `Thinking of you today. — ${params.companionName}`
  );
}
