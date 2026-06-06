import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Group = { id: string; name: string; count: number; active: boolean };
type Message = { id: string; type: 'system' | 'self' | 'normal'; author: string; text: string };
type InviteRecord = { id: string; detail: string; status: string; created_at: string };
type MemberRecord = { id: string; user_id: string; nickname: string; goose_rate: number };

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/login');

  const [groupsRes, messagesRes, invitesRes, membersRes] = await Promise.all([
    supabase.from('groups').select('*').order('created_at', { ascending: true }),
    supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.from('invites').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('group_members').select('id, user_id, goose_rate, users(nickname), group_id').limit(50),
  ]);

  const groups: Group[] = groupsRes.data?.map((g, idx) => ({ id: g.id, name: g.name, count: g.count, active: idx === 0 })) ?? [];
  const messages: Message[] = messagesRes.data?.map((m) => ({ id: m.id, type: m.message_type as Message['type'], author: m.author, text: m.text })) ?? [];
  const invites: InviteRecord[] = invitesRes.data ?? [];
  const members: MemberRecord[] = membersRes.data?.map((m: any) => ({ id: m.id, user_id: m.user_id, nickname: m.users?.nickname ?? '未知用户', goose_rate: m.goose_rate })) ?? [];

  return (
    <main className="app-shell">
      <header className="hero card">
        <div>
          <div className="badge">鸽子群 · 邀约 · 群聊 · 弹窗提醒</div>
          <h1>鸽子侠</h1>
          <p className="subtitle">你好，{currentUser.nickname}。群里能聊天，能群摇人，也能指定召唤某个朋友，收到邀请时会弹出醒目的提示框。</p>
        </div>
        <div className="hero-stats">
          <div className="stat"><span>鸽子群</span><strong>{groups.length}</strong></div>
          <div className="stat"><span>待响应</span><strong>{invites.filter((i) => i.status === 'pending').length}</strong></div>
          <div className="stat"><span>本周鸽王</span><strong>阿飞</strong></div>
          <Link href="/logout" className="ghost-btn">退出登录</Link>
        </div>
      </header>

      <section className="content-grid">
        <section className="card left-panel">
          <div className="section-title-row"><h2>我的鸽子群</h2><Link href="/groups" className="ghost-btn">查看全部</Link></div>
          <div className="group-list">{groups.map((g) => <Link key={g.id} href={`/groups/${g.id}`} className={`group-item ${g.active ? 'active' : ''}`}><div className="name-row"><strong>{g.name}</strong><span>{g.count}人</span></div><div className="muted">点击进入群聊 / 群摇人</div></Link>)}</div>
        </section>

        <section className="card center-panel">
          <div className="section-title-row"><h2>最近消息</h2><Link href="/groups" className="pill">去群页</Link></div>
          <div className="chat-window">{messages.map((m) => <div key={m.id} className={`message ${m.type === 'self' ? 'self' : m.type === 'system' ? 'system' : ''}`}><div className="message-head"><strong>{m.author}</strong><span>{m.type === 'system' ? '提示' : '刚刚'}</span></div><div>{m.text}</div></div>)}</div>
          <div className="tip-box">这里显示最新群聊动态，完整功能可在群详情页继续操作。</div>
        </section>

        <section className="card right-panel">
          <div className="section-title-row"><h2>成员鸽子值</h2><Link href="/invites" className="pill">邀请中心</Link></div>
          <div className="member-list">{members.map((m) => <div key={m.id} className="member-item"><div className="name-row"><strong>{m.nickname}</strong><span>{m.goose_rate}%</span></div><div className="bar"><div style={{ width: `${m.goose_rate}%` }} /></div></div>)}</div>
        </section>
      </section>
    </main>
  );
}
