import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/lib/prompt';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('companions')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ companions: data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    age,
    personality,
    backstory,
    tone,
    exampleLines,
    voiceStyle,
    ageVerified,
  } = body as {
    name: string;
    age?: number;
    personality?: string;
    backstory?: string;
    tone?: string;
    exampleLines?: string;
    voiceStyle?: string;
    ageVerified?: boolean;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  if (!ageVerified) {
    return NextResponse.json({ error: 'You must confirm you are 18+' }, { status: 400 });
  }

  // Stamp age verification on profile
  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      age_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  const input = {
    name: name.trim(),
    age: age ?? null,
    personality,
    backstory,
    tone,
    exampleLines,
    voiceStyle,
  };

  const systemPrompt = buildSystemPrompt(input);

  const { data, error } = await supabase
    .from('companions')
    .insert({
      owner_id: user.id,
      name: input.name,
      age: input.age,
      personality: personality || null,
      backstory: backstory || null,
      tone: tone || 'warm',
      example_lines: exampleLines || null,
      voice_style: voiceStyle || 'soft',
      system_prompt: systemPrompt,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ companion: data });
}
