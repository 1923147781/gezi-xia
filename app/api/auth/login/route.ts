import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { COOKIE_OPTIONS, NICKNAME_COOKIE, USER_ID_COOKIE } from '@/lib/auth/constants';

export async function POST(request: Request) {
  const { nickname } = await request.json().catch(() => ({ nickname: '' }));
  const name = String(nickname || '').trim();

  if (!name) {
    return NextResponse.json({ error: 'nickname_required' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'supabase_unavailable' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({ nickname: name }, { onConflict: 'nickname' })
    .select('id, nickname, avatar_seed')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'login_failed' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, user: data });
  response.cookies.set(NICKNAME_COOKIE, encodeURIComponent(name), COOKIE_OPTIONS);
  response.cookies.set(USER_ID_COOKIE, data.id, COOKIE_OPTIONS);
  return response;
}
