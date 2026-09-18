import { getChatModel, getOpenAI } from '@/lib/openai';
import type { ChatMessage } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type ExtractedFact = {
  fact: string;
  category: string;
  importance: number;
};

export async function extractMemoryFacts(
  recent: ChatMessage[],
  companionName: string
): Promise<ExtractedFact[]> {
  if (recent.length === 0) return [];

  const openai = getOpenAI();
  const transcript = recent
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'User' : companionName}: ${m.content}`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: getChatModel(),
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Extract durable personal facts about the USER from this chat that an AI companion should remember weeks later.
Return JSON: {"facts":[{"fact":"...","category":"preference|people|event|emotion|routine|other","importance":1-10}]}
Only include clear, lasting facts (name, birthday mentions, partner/kids/pets, job, fears, likes, important dates). Skip fluff. Max 5 facts. If none, {"facts":[]}.`,
      },
      { role: 'user', content: transcript },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{"facts":[]}';
  try {
    const parsed = JSON.parse(raw) as { facts?: ExtractedFact[] };
    return (parsed.facts || [])
      .filter((f) => f.fact && f.fact.trim().length > 3)
      .slice(0, 5)
      .map((f) => ({
        fact: f.fact.trim(),
        category: f.category || 'other',
        importance: Math.min(10, Math.max(1, Number(f.importance) || 5)),
      }));
  } catch {
    return [];
  }
}

export async function saveMemoryFacts(
  supabase: SupabaseClient,
  params: {
    companionId: string;
    userId: string;
    facts: ExtractedFact[];
  }
): Promise<void> {
  if (params.facts.length === 0) return;

  // Deduplicate against recent similar facts (simple exact match)
  const { data: existing } = await supabase
    .from('memory_facts')
    .select('fact')
    .eq('companion_id', params.companionId)
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(100);

  const existingSet = new Set((existing || []).map((r) => r.fact.toLowerCase()));
  const rows = params.facts
    .filter((f) => !existingSet.has(f.fact.toLowerCase()))
    .map((f) => ({
      companion_id: params.companionId,
      user_id: params.userId,
      fact: f.fact,
      category: f.category,
      importance: f.importance,
      metadata: {},
    }));

  if (rows.length === 0) return;
  await supabase.from('memory_facts').insert(rows);
}

export async function recallMemoryFacts(
  supabase: SupabaseClient,
  params: {
    companionId: string;
    userId: string;
    query?: string;
    limit?: number;
  }
): Promise<string[]> {
  const limit = params.limit ?? 12;

  // JSONB / importance fallback (pgvector similarity can be added later)
  const { data } = await supabase
    .from('memory_facts')
    .select('id, fact, importance')
    .eq('companion_id', params.companionId)
    .eq('user_id', params.userId)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  const facts = data || [];

  // Soft keyword boost if query provided
  if (params.query && facts.length > 0) {
    const q = params.query.toLowerCase();
    facts.sort((a, b) => {
      const aHit = a.fact.toLowerCase().includes(q) ? 2 : 0;
      const bHit = b.fact.toLowerCase().includes(q) ? 2 : 0;
      return bHit + b.importance - (aHit + a.importance);
    });
  }

  const ids = facts.map((f) => f.id);
  if (ids.length > 0) {
    await supabase
      .from('memory_facts')
      .update({ last_recalled_at: new Date().toISOString() })
      .in('id', ids);
  }

  return facts.map((f) => f.fact);
}
