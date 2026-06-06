'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Group = { id: string; name: string; count: number; active: boolean };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('groups').select('*').order('created_at', { ascending: true });
      if (data) setGroups(data.map((g, idx) => ({ ...g, active: idx === 0 })));
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
        <div className="group-list">{groups.map((g) => <Link key={g.id} href={`/groups/${g.id}`} className={`group-item ${g.active ? 'active' : ''}`}><div className="name-row"><strong>{g.name}</strong><span>{g.count}人</span></div><div className="muted">进入群详情</div></Link>)}</div>
      </section>
    </main>
  );
}
