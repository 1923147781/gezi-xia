'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type InviteRecord = { id: string; detail: string; status: string; created_at: string };

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('gezi-nickname');
    if (!stored) router.push('/login');
  }, [router]);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('invites').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setInvites(data as InviteRecord[]);
    };
    load();
  }, []);

  return (
    <main className="app-shell">
      <div className="topbar card" style={{ marginBottom: 18 }}>
        <Link href="/dashboard" className="ghost-btn">返回仪表盘</Link>
        <Link href="/groups" className="ghost-btn">群列表</Link>
        <Link href="/settings" className="ghost-btn">设置</Link>
      </div>
      <section className="card invite-panel">
        <h1>邀请中心</h1>
        <p className="subtitle">这里集中查看所有摇人记录和状态。</p>
        <div className="invite-list">{invites.map((item) => <div key={item.id} className="invite-item"><strong>{item.detail}</strong><span className="muted">状态：{item.status} · {new Date(item.created_at).toLocaleString()}</span></div>)}</div>
      </section>
    </main>
  );
}
