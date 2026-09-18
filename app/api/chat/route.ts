import { NextRequest, NextResponse } from 'next/server';
import { chatWithCompanion } from '@/lib/companion';
import { extractMemoryFacts, recallMemoryFacts, saveMemoryFacts } from '@/lib/memory';
import { createClient } from '@/lib/supabase/server';
import type { ChatMessage, CompanionInput } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companionId,
      companion: companionPayload,
      history,
      message,
      modality = 'text',
    } = body as {
      companionId?: string;
      companion?: CompanionInput & { system_prompt?: string };
      history?: ChatMessage[];
      message: string;
      modality?: 'text' | 'voice' | 'image';
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let companionInput: CompanionInput;
    let systemPromptOverride: string | undefined;
    let resolvedCompanionId = companionId;
    let memoryFacts: string[] = [];
    let userDisplayName: string | null = null;

    if (user && companionId) {
      const { data: row, error } = await supabase
        .from('companions')
        .select('*')
        .eq('id', companionId)
        .single();

      if (error || !row) {
        return NextResponse.json({ error: 'Companion not found' }, { status: 404 });
      }

      companionInput = {
        name: row.name,
        age: row.age,
        personality: row.personality ?? undefined,
        backstory: row.backstory ?? undefined,
        tone: row.tone ?? undefined,
        exampleLines: row.example_lines ?? undefined,
        voiceStyle: row.voice_style ?? undefined,
      };
      systemPromptOverride = row.system_prompt;
      resolvedCompanionId = row.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();
      userDisplayName = profile?.display_name ?? null;

      memoryFacts = await recallMemoryFacts(supabase, {
        companionId: row.id,
        userId: user.id,
        query: message,
        limit: 12,
      });

      await supabase.from('messages').insert({
        companion_id: row.id,
        user_id: user.id,
        role: 'user',
        content: message,
        modality,
      });
    } else if (companionPayload?.name) {
      // Guest / local fallback (no persistence)
      companionInput = companionPayload;
      systemPromptOverride = companionPayload.system_prompt;
    } else {
      return NextResponse.json(
        { error: 'Sign in and provide companionId, or pass companion payload' },
        { status: 400 }
      );
    }

    const reply = await chatWithCompanion(
      companionInput,
      history || [],
      message,
      {
        systemPromptOverride,
        memoryFacts,
        userDisplayName,
      }
    );

    if (user && resolvedCompanionId) {
      await supabase.from('messages').insert({
        companion_id: resolvedCompanionId,
        user_id: user.id,
        role: 'assistant',
        content: reply,
        modality: 'text',
      });

      // Fire-and-forget memory extraction
      const recent: ChatMessage[] = [
        ...(history || []).slice(-10),
        { role: 'user', content: message },
        { role: 'assistant', content: reply },
      ];
      extractMemoryFacts(recent, companionInput.name)
        .then((facts) =>
          saveMemoryFacts(supabase, {
            companionId: resolvedCompanionId!,
            userId: user.id,
            facts,
          })
        )
        .catch((err) => console.error('memory extract failed', err));
    }

    return NextResponse.json({ reply, memoriesUsed: memoryFacts.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
