import { NextRequest, NextResponse } from 'next/server';
import { generateOutreachMessage } from '@/lib/companion';
import { occasionsForDate, upcomingDates } from '@/lib/holidays';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization');
  if (header === `Bearer ${secret}`) return true;
  // Vercel Cron sends this header when CRON_SECRET is configured
  const vercelCron = req.headers.get('x-vercel-cron-secret') || req.headers.get('x-cron-secret');
  if (vercelCron && vercelCron === secret) return true;
  const q = req.nextUrl.searchParams.get('secret');
  return q === secret;
}

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: { companionId: string; occasion: string; status: string }[] = [];

  // Load companions with owner profiles
  const { data: companions, error } = await supabase
    .from('companions')
    .select('id, name, system_prompt, owner_id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const companion of companions || []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, birthday, timezone')
      .eq('id', companion.owner_id)
      .maybeSingle();

    const tz = profile?.timezone || 'America/Chicago';
    const dates = upcomingDates(1, tz); // today + tomorrow window

    for (const isoDate of dates) {
      const occasions = occasionsForDate(isoDate, profile?.birthday ?? null);
      for (const occasion of occasions) {
        // Upsert pending outreach
        const { data: existing } = await supabase
          .from('scheduled_outreaches')
          .select('id, status')
          .eq('companion_id', companion.id)
          .eq('occasion', occasion.key)
          .eq('scheduled_for', isoDate)
          .maybeSingle();

        if (existing?.status === 'sent') {
          results.push({ companionId: companion.id, occasion: occasion.key, status: 'already_sent' });
          continue;
        }

        let outreachId = existing?.id;
        if (!outreachId) {
          const { data: inserted, error: insertErr } = await supabase
            .from('scheduled_outreaches')
            .insert({
              companion_id: companion.id,
              user_id: companion.owner_id,
              occasion: occasion.key,
              scheduled_for: isoDate,
              status: 'pending',
            })
            .select('id')
            .single();

          if (insertErr) {
            results.push({ companionId: companion.id, occasion: occasion.key, status: 'insert_failed' });
            continue;
          }
          outreachId = inserted.id;
        }

        // Only send if scheduled_for is today in user TZ
        const today = upcomingDates(0, tz)[0];
        if (isoDate !== today) {
          results.push({ companionId: companion.id, occasion: occasion.key, status: 'scheduled' });
          continue;
        }

        const { data: memories } = await supabase
          .from('memory_facts')
          .select('fact')
          .eq('companion_id', companion.id)
          .eq('user_id', companion.owner_id)
          .order('importance', { ascending: false })
          .limit(8);

        try {
          const note = await generateOutreachMessage({
            companionName: companion.name,
            systemPrompt: companion.system_prompt,
            occasion: occasion.label,
            userDisplayName: profile?.display_name,
            memoryFacts: (memories || []).map((m) => m.fact),
            timezone: tz,
          });

          const { data: msg, error: msgErr } = await supabase
            .from('messages')
            .insert({
              companion_id: companion.id,
              user_id: companion.owner_id,
              role: 'assistant',
              content: note,
              modality: 'text',
            })
            .select('id')
            .single();

          if (msgErr) throw msgErr;

          await supabase
            .from('scheduled_outreaches')
            .update({
              status: 'sent',
              message_id: msg.id,
              sent_at: new Date().toISOString(),
              error: null,
            })
            .eq('id', outreachId);

          results.push({ companionId: companion.id, occasion: occasion.key, status: 'sent' });
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'failed';
          await supabase
            .from('scheduled_outreaches')
            .update({ status: 'failed', error: errMsg })
            .eq('id', outreachId);
          results.push({ companionId: companion.id, occasion: occasion.key, status: 'failed' });
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    results,
  });
}
