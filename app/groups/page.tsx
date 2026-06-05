'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Group = { id: string; name: string; count: number };

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('gezi-nickname');
    if (!stored) router.push('/login');
  }, [router]);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: true });
      if (data) setGroups(data as Group[]);
    };
    load();
  }, []);

  return (
    <main className="app-shell">
      <div className="topbar card" style={{ marginBottom: 18 }}>
        <Link href="/dashboard" className="ghost-btn">返回仪表盘</Link>
        <Link href="/invites" className="ghost-btn">邀请中心</Link>
        <Link href="/settings" className="ghost-btn">设置</Link>
      </div>
      <section className="card invite-panel">
        <h1>群列表</h1>
        <p className="subtitle">所有鸽子群都在这里。</p>
        <div className="group-list">{groups.map((g) => <Link key={g.id} href={`/groups/${g.id}`} className="group-item"><div className="name-row"><strong>{g.name}</strong><span>{g.count}人</span></div><div className="muted">点击进入群详情</div></Link>)}</div>
      </section>
    </main>
  );
}
