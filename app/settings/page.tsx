'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearClientAuthStorage } from '@/lib/auth/cookies';

export default function SettingsPage() {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearClientAuthStorage();
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="app-shell">
      <div className="topbar card" style={{ marginBottom: 18 }}>
        <Link href="/dashboard" className="ghost-btn">返回仪表盘</Link>
        <Link href="/groups" className="ghost-btn">群列表</Link>
        <Link href="/invites" className="ghost-btn">邀请中心</Link>
      </div>
      <section className="card invite-panel">
        <h1>设置</h1>
        <p className="subtitle">这里可以继续扩展头像、通知、退出登录等功能。</p>
        <div className="tip-box">当前版本已完成上线所需的主要页面结构。</div>
        <button className="danger-btn" onClick={logout}>退出登录</button>
      </section>
    </main>
  );
}
