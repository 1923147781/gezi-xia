'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NICKNAME_COOKIE, USER_ID_COOKIE } from '@/lib/auth/constants';
import { safeNextPath } from '@/lib/auth/cookies';
import { authErrorMessage } from '@/lib/auth/errors';

type AuthMode = 'login' | 'register';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finishAuth = (result: { user?: { id: string; nickname: string } }) => {
    const name = nickname.trim();
    localStorage.setItem(NICKNAME_COOKIE, name);
    if (result.user?.id) localStorage.setItem(USER_ID_COOKIE, result.user.id);

    const next = safeNextPath(searchParams.get('next'));
    router.replace(next ?? '/dashboard');
    router.refresh();
  };

  const submit = async (authMode: AuthMode) => {
    const name = nickname.trim();
    if (!name) {
      setError(authErrorMessage('nickname_required'));
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: name }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || (authMode === 'login' ? 'login_failed' : 'register_failed'));
      finishAuth(result);
    } catch (err) {
      const code = err instanceof Error ? err.message : 'login_failed';
      setError(authErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card login-card">
      <div className="badge">鸽子侠 · {mode === 'login' ? '登录' : '注册'}</div>
      <h1>{mode === 'login' ? '欢迎回来' : '加入鸽子侠'}</h1>
      <p className="subtitle">
        {mode === 'login'
          ? '输入已注册的昵称登录，进入鸽子群、聊天和摇人。'
          : '注册一个新昵称，开始你的鸽子侠之旅。'}
      </p>

      <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('login'); setError(''); }}>
          登录
        </button>
        <button type="button" className={mode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('register'); setError(''); }}>
          注册
        </button>
      </div>

      <div className="create-form">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="请输入昵称，例如：阿飞"
          onKeyDown={(e) => e.key === 'Enter' && !loading && submit(mode)}
        />
        {mode === 'login' ? (
          <button className="primary-btn" onClick={() => submit('login')} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        ) : (
          <button className="primary-btn" onClick={() => submit('register')} disabled={loading}>
            {loading ? '注册中...' : '注册并进入'}
          </button>
        )}
        {error ? <p className="auth-error">{error}</p> : null}
        {mode === 'login' ? (
          <p className="muted">还没有账号？切换到「注册」创建昵称。</p>
        ) : (
          <p className="muted">已有账号？切换到「登录」。</p>
        )}
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
