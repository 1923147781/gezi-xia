'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const name = nickname.trim();
    if (!name) return;
    setLoading(true);
    localStorage.setItem('gezi-nickname', name);
    if (supabase) {
      await supabase.from('users').upsert({ nickname: name }).select().single();
    }
    router.push('/dashboard');
    setLoading(false);
  };

  return (
    <main className="app-shell login-shell">
      <section className="card login-card">
        <div className="badge">鸽子侠 · 先登录昵称</div>
        <h1>欢迎来到鸽子侠</h1>
        <p className="subtitle">先输入你的昵称，再进入鸽子群、聊天和摇人。</p>
        <div className="create-form">
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="请输入昵称，例如：阿飞" />
          <button className="primary-btn" onClick={login} disabled={loading}>{loading ? '进入中...' : '进入鸽子侠'}</button>
        </div>
      </section>
    </main>
  );
}
