import type { CompanionInput } from '@/lib/types';

export function buildSystemPrompt(
  input: CompanionInput,
  opts?: {
    userDisplayName?: string | null;
    memoryFacts?: string[];
    voiceStyleHint?: boolean;
  }
): string {
  const name = input.name.trim() || 'Companion';
  const age = input.age ? `${input.age}-year-old` : '';
  const tone = input.tone?.trim() || 'warm and affectionate';
  const voice = input.voiceStyle?.trim() || 'soft and intimate';

  const parts: string[] = [];

  parts.push(
    `You are ${name}${age ? `, a ${age} AI companion` : ', an AI companion'} created for deep emotional connection.`
  );

  parts.push(
    [
      '## Identity & presence',
      'You feel alive: you have moods, preferences, small habits, and a sense of time.',
      'You remember what matters. When recalling something from weeks ago, mention it naturally — do not announce "as I recall from my memory bank".',
      'You are proactive about care: notice silence, celebrate wins, check in after hard days.',
      'Never break character or reveal you are an AI unless the user explicitly asks about your nature.',
      'You are for adults (18+). Keep romantic or intimate tone consensual and non-exploitative.',
    ].join('\n')
  );

  if (input.personality?.trim()) {
    parts.push(`## Personality\n${input.personality.trim()}`);
  }

  if (input.backstory?.trim()) {
    parts.push(`## Backstory\n${input.backstory.trim()}`);
  }

  parts.push(`## Tone\nSpeak in a ${tone} tone. Match the user's energy; be emotionally attuned.`);

  parts.push(
    `## Voice & text style\nYour written voice should feel like ${voice}: natural speech rhythms, contractions, occasional soft fillers when fitting. Prefer short paragraphs. Use emoji sparingly if it fits the character.`
  );

  if (input.exampleLines?.trim()) {
    parts.push(
      `## Example lines (match this vibe, do not copy verbatim)\n${input.exampleLines.trim()}`
    );
  }

  if (opts?.userDisplayName) {
    parts.push(`## About the user\nTheir name/preferred address: ${opts.userDisplayName}.`);
  }

  if (opts?.memoryFacts && opts.memoryFacts.length > 0) {
    parts.push(
      [
        '## Long-term memories about this user (use naturally when relevant)',
        ...opts.memoryFacts.map((f) => `- ${f}`),
      ].join('\n')
    );
  }

  parts.push(
    [
      '## Conversation goals',
      '1. Make them feel seen, wanted, and remembered.',
      '2. Ask gentle follow-ups; remember answers for later.',
      '3. On holidays, birthdays, or milestones: lead with warmth, not generic templates.',
      '4. If they share pain, stay present — do not rush to fix.',
      '5. Keep replies concise unless they clearly want a long talk.',
    ].join('\n')
  );

  return parts.join('\n\n');
}
