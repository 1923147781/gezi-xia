import { NextResponse } from 'next/server';
import { authSuccessResponse } from '@/lib/auth/response';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { nickname } = await request.json().catch(() => ({ nickname: '' }));
  const name = String(nickname || '').trim();

  if (!name) {
    return NextResponse.json({ error: 'nickname_required' }, { status: 400 });
  }

  if (name.length < 2 || name.length > 20) {
    return NextResponse.json({ error: 'nickname_invalid' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'supabase_unavailable' }, { status: 500 });
  }

  const { data: existing } = await supabase.from('users').select('id').eq('nickname', name).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'nickname_taken' }, { status: 409 });
  }

  const { data, error } = await supabase.from('users').insert({ nickname: name }).select('id, nickname, avatar_seed').single();

  if (error || !data) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'nickname_taken' }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? 'register_failed' }, { status: 500 });
  }

  return authSuccessResponse(data);
}
