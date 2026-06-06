'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NICKNAME_COOKIE, USER_ID_COOKIE } from '@/lib/auth/constants';
import { safeNextPath } from '@/lib/auth/cookies';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async () => {
    const name = nickname.trim();
    if (!name) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'login_failed');

      localStorage.setItem(NICKNAME_COOKIE, name);
      if (result.user?.id) localStorage.setItem(USER_ID_COOKIE, result.user.id);

      const next = safeNextPath(searchParams.get('next'));
      router.replace(next ?? '/dashboard');
      router.refresh();
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card login-card">
      <div className="badge">鸽子侠 · 先登录昵称</div>
      <h1>欢迎来到鸽子侠</h1>
      <p className="subtitle">先输入你的昵称，再进入鸽子群、聊天和摇人。</p>
      <div className="create-form">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="请输入昵称，例如：阿飞"
          onKeyDown={(e) => e.key === 'Enter' && login()}
        />
        <button className="primary-btn" onClick={login} disabled={loading}>
          {loading ? '进入中...' : '进入鸽子侠'}
        </button>
        {error ? <p className="muted">{error}</p> : null}
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main className="app-shell login-shell">
      <Suspense fallback={<section className="card login-card">加载中...</section>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
