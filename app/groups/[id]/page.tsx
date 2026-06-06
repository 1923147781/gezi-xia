'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { readClientNickname, readClientUserId } from '@/lib/auth/cookies';
import { supabase } from '@/lib/supabase/client';

type Group = { id: string; name: string; count: number; active: boolean };
type Message = { id: string; type: 'system' | 'self' | 'normal'; author: string; text: string };
type MemberRecord = { id: string; user_id: string; nickname: string; goose_rate: number };

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const [nickname, setNickname] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [inviteDetail, setInviteDetail] = useState('今晚来打两把，缺人速来。');
  const [selectedTarget, setSelectedTarget] = useState('');

  const selectedMember = useMemo(() => members.find((m) => m.user_id === selectedTarget) ?? null, [members, selectedTarget]);

  useEffect(() => {
    const storedNickname = readClientNickname();
    const storedUserId = readClientUserId();
    if (storedNickname) setNickname(storedNickname);
    if (storedUserId) setCurrentUserId(storedUserId);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;

      let userId = currentUserId;
      if (!userId && nickname) {
        const { data: userData } = await supabase.from('users').select('id').eq('nickname', nickname).limit(1);
        if (userData?.[0]) {
          userId = userData[0].id;
          setCurrentUserId(userId);
        }
      }

      const [groupRes, msgRes, memberRes] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('messages').select('*').eq('group_id', groupId).order('created_at', { ascending: false }).limit(50),
        supabase.from('group_members').select('id, user_id, goose_rate, users(nickname), group_id').eq('group_id', groupId),
      ]);
      if (!groupRes.error && groupRes.data) setGroup(groupRes.data as Group);
      if (!msgRes.error && msgRes.data) setMessages(msgRes.data.map((m) => ({ id: m.id, type: m.message_type as Message['type'], author: m.author, text: m.text })));
      if (!memberRes.error && memberRes.data) setMembers(memberRes.data.map((m: any) => ({ id: m.id, user_id: m.user_id, nickname: m.users?.nickname ?? '未知用户', goose_rate: m.goose_rate })));
    };
    if (nickname) load();
  }, [nickname, currentUserId, groupId]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel(`group-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` }, async () => {
        const { data } = await client.from('messages').select('*').eq('group_id', groupId).order('created_at', { ascending: false }).limit(50);
        if (data) setMessages(data.map((m) => ({ id: m.id, type: m.message_type as Message['type'], author: m.author, text: m.text })));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, async () => {
        const { data } = await client.from('group_members').select('id, user_id, goose_rate, users(nickname), group_id').eq('group_id', groupId);
        if (data) setMembers(data.map((m: any) => ({ id: m.id, user_id: m.user_id, nickname: m.users?.nickname ?? '未知用户', goose_rate: m.goose_rate })));
      })
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !supabase || !currentUserId) return;
    await supabase.from('messages').insert({ group_id: groupId, author_user_id: currentUserId, author: nickname, text, message_type: 'self' });
    setMessageInput('');
  };

  const sendInvite = async () => {
    if (!supabase || !currentUserId || !selectedMember) return;
    await supabase.from('shake_events').insert({ group_id: groupId, created_by: currentUserId, target_user_id: selectedMember.user_id, target_name: selectedMember.nickname, title: '指定摇人', detail: inviteDetail, progress: 73 });
    await supabase.from('invites').insert({ group_id: groupId, from_user_id: currentUserId, to_user_id: selectedMember.user_id, invite_type: 'shake', status: 'pending', detail: inviteDetail });
  };

  if (!group) {
    return (
      <main className="app-shell">
        <div className="card invite-panel">加载群信息中...</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="topbar card" style={{ marginBottom: 18 }}>
        <Link href="/dashboard" className="ghost-btn">返回仪表盘</Link>
        <Link href="/settings" className="ghost-btn">设置</Link>
        <Link href="/logout" className="ghost-btn">退出登录</Link>
      </div>
      <section className="card invite-panel" style={{ marginBottom: 18 }}>
        <h1 style={{ marginTop: 0 }}>{group.name}</h1>
        <p className="subtitle">群内消息、成员与摇人操作都在这里。</p>
      </section>
      <section className="content-grid">
        <section className="card center-panel">
          <h2>群聊</h2>
          <div className="chat-window">{messages.map((m) => <div key={m.id} className={`message ${m.type === 'self' ? 'self' : m.type === 'system' ? 'system' : ''}`}><div className="message-head"><strong>{m.author}</strong><span>{m.type === 'system' ? '提示' : '刚刚'}</span></div><div>{m.text}</div></div>)}</div>
          <div className="composer"><input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="说点什么..." /><button className="primary-btn" onClick={sendMessage}>发送</button></div>
          <div className="create-form" style={{ marginTop: 16 }}><input value={inviteDetail} onChange={(e) => setInviteDetail(e.target.value)} placeholder="邀请内容" /><button className="ghost-btn" onClick={sendInvite}>向选中成员发邀请</button></div>
        </section>
        <section className="card right-panel">
          <h2>群成员</h2>
          <div className="member-list">{members.map((m) => <div key={m.id} className="member-item"><div className="name-row"><strong>{m.nickname}</strong><span>{m.goose_rate}%</span></div><div className="bar"><div style={{ width: `${m.goose_rate}%` }} /></div><div className="action-row" style={{ marginTop: 10 }}><button className="ghost-btn" onClick={() => setSelectedTarget(m.user_id)}>选择</button></div></div>)}</div>
          <div className="tip-box">选择一位成员后，可从这里直接发起指定摇人。</div>
        </section>
      </section>
    </main>
  );
}
