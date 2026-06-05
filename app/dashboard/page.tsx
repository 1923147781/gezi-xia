'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Group = { id: string; name: string; count: number; active: boolean };
type Message = { id: string; type: 'system' | 'self' | 'normal'; author: string; text: string };
type UserRecord = { id: string; nickname: string };
type InviteRecord = { id: string; detail: string; status: string; created_at: string };
type MemberRecord = { id: string; user_id: string; nickname: string; goose_rate: number };

export default function DashboardPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [groupName, setGroupName] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('你被摇了');
  const [modalText, setModalText] = useState('');
  const [progress, setProgress] = useState(68);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [inviteDetail, setInviteDetail] = useState('今晚来打两把，缺人速来。');

  const activeGroup = useMemo(() => groups.find((g) => g.active) ?? groups[0], [groups]);
  const selectedMember = useMemo(() => members.find((m) => m.user_id === selectedTarget) ?? null, [members, selectedTarget]);

  const refreshAll = async () => {
    if (!supabase || !currentUser) return;
    const [groupsRes, messagesRes, invitesRes, membersRes] = await Promise.all([
      supabase.from('groups').select('*').order('created_at', { ascending: true }),
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('invites').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('group_members').select('id, user_id, goose_rate, users(nickname), group_id').eq('group_id', activeGroup?.id ?? ''),
    ]);

    if (!groupsRes.error && groupsRes.data?.length) {
      setGroups(groupsRes.data.map((g, idx) => ({ id: g.id, name: g.name, count: g.count, active: idx === 0 })));
    }
    if (!messagesRes.error && messagesRes.data?.length) {
      setMessages(messagesRes.data.map((m) => ({ id: m.id, type: m.message_type as Message['type'], author: m.author, text: m.text })));
    }
    if (!invitesRes.error && invitesRes.data?.length) setInvites(invitesRes.data as InviteRecord[]);
    if (!membersRes.error && membersRes.data?.length) {
      setMembers(
        membersRes.data.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          nickname: m.users?.nickname ?? '未知用户',
          goose_rate: m.goose_rate,
        })),
      );
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('gezi-nickname');
    if (!stored) {
      router.push('/login');
      return;
    }
    setNickname(stored);
    if (supabase) {
      supabase.from('users').select('*').eq('nickname', stored).limit(1).then(({ data }) => {
        if (data?.[0]) setCurrentUser(data[0] as UserRecord);
      });
    }
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    refreshAll();
  }, [currentUser, activeGroup?.id]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('gezi-xia-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invites' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, refreshAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, activeGroup?.id]);

  const createGroup = async () => {
    const name = groupName.trim();
    if (!name || !currentUser || !supabase) return;
    const { data } = await supabase.from('groups').insert({ name, count: 1, active: true, created_by: currentUser.id }).select().single();
    if (data) {
      const g = data as Group;
      setGroups((prev) => prev.map((item) => ({ ...item, active: false })).concat({ ...g, active: true }));
      await supabase.from('group_members').insert({ group_id: g.id, user_id: currentUser.id, role: 'owner', goose_rate: 10 });
    }
    setGroupName('');
    setShowCreate(false);
  };

  const joinGroup = async (groupId: string) => {
    if (!currentUser || !supabase) return;
    await supabase.from('group_members').upsert({ group_id: groupId, user_id: currentUser.id, role: 'member', goose_rate: 50 }, { onConflict: 'group_id,user_id' });
    setGroups((prev) => prev.map((g) => ({ ...g, active: g.id === groupId })));
  };

  const leaveGroup = async (groupId: string) => {
    if (!currentUser || !supabase) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', currentUser.id);
  };

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !currentUser || !supabase) return;
    await supabase.from('messages').insert({ author: currentUser.nickname, author_user_id: currentUser.id, text, message_type: 'self', group_id: activeGroup?.id ?? null });
    setMessageInput('');
  };

  const emitShake = async (target_name: string, title: string, detail: string, progressValue = 68, toUserId?: string) => {
    if (!currentUser || !supabase) return;
    const activeGroupId = activeGroup?.id ?? null;
    await supabase.from('shake_events').insert({ group_id: activeGroupId, created_by: currentUser.id, target_user_id: toUserId ?? null, target_name, title, detail, progress: progressValue });
    await supabase.from('invites').insert({ group_id: activeGroupId, from_user_id: currentUser.id, to_user_id: toUserId ?? null, invite_type: 'shake', status: 'pending', detail });
    setModalTitle(`${target_name}，你被摇了`);
    setModalText(detail);
    setProgress(progressValue);
    setModalOpen(true);
  };

  const respondInvite = async (status: 'accepted' | 'goose' | 'later') => {
    const latest = invites[0];
    if (supabase && latest) await supabase.from('invites').update({ status, responded_at: new Date().toISOString() }).eq('id', latest.id);
    setModalOpen(false);
  };

  const sendInviteToSelected = async () => {
    if (!selectedMember) return;
    await emitShake(selectedMember.nickname, '指定摇人', inviteDetail, 73, selectedMember.user_id);
  };

  if (!currentUser) return null;

  return (
    <main className="app-shell">
      <header className="hero card">
        <div>
          <div className="badge">鸽子群 · 邀约 · 群聊 · 弹窗提醒</div>
          <h1>鸽子侠</h1>
          <p className="subtitle">你好，{nickname}。群里能聊天，能群摇人，也能指定召唤某个朋友，收到邀请时会弹出醒目的提示框。</p>
        </div>
        <div className="hero-stats">
          <div className="stat"><span>鸽子群</span><strong>{groups.length}</strong></div>
          <div className="stat"><span>待响应</span><strong>{invites.filter((i) => i.status === 'pending').length}</strong></div>
          <div className="stat"><span>本周鸽王</span><strong>阿飞</strong></div>
        </div>
      </header>

      <section className="content-grid">
        <section className="card left-panel">
          <div className="section-title-row"><h2>我的鸽子群</h2><button className="ghost-btn" onClick={() => setShowCreate((v) => !v)}>+ 创建群</button></div>
          <div className="group-list">{groups.map((g) => <button key={g.id} className={`group-item ${g.active ? 'active' : ''}`} onClick={() => joinGroup(g.id)}><div className="name-row"><strong>{g.name}</strong><span>{g.count}人</span></div><div className="muted">点击进入群聊 / 群摇人</div></button>)}</div>
          {showCreate && <div className="create-form"><input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="输入自定义群名" /><button className="primary-btn" onClick={createGroup}>创建</button></div>}
        </section>

        <section className="card center-panel">
          <div className="section-title-row"><h2>{activeGroup?.name ?? '周末开黑群'}</h2><span className="pill">在线 {members.length} 人</span></div>
          <div className="chat-window">{messages.map((m) => <div key={m.id} className={`message ${m.type === 'self' ? 'self' : m.type === 'system' ? 'system' : ''}`}><div className="message-head"><strong>{m.author}</strong><span>{m.type === 'system' ? '提示' : '刚刚'}</span></div><div>{m.text}</div></div>)}</div>
          <div className="composer"><input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="发条消息，或者顺手摇个人..." /><button className="primary-btn" onClick={sendMessage}>发送</button></div>
          <div className="action-row"><button className="action-btn" onClick={() => emitShake('全体成员', '群里发起了群摇人', '今晚 8 点来打两把，缺人速来。', 54)}>群摇人</button><button className="action-btn" onClick={() => selectedMember ? sendInviteToSelected() : setSelectedTarget('')}>指定摇人</button><button className="action-btn" onClick={() => emitShake('鸽子长度', '鸽子长度', '你当前的鸽子长度已更新，可在这里查看进度条。', 88)}>鸽子长度</button></div>
          <div className="create-form" style={{ marginTop: 16 }}><input value={inviteDetail} onChange={(e) => setInviteDetail(e.target.value)} placeholder="填写指定摇人的内容" /><button className="ghost-btn" onClick={() => sendInviteToSelected()}>向已选成员发邀请</button></div>
          <div className="invite-list" style={{ marginTop: 16 }}><h3>群成员</h3>{members.map((m) => <div key={m.id} className="invite-item"><strong>{m.nickname}</strong><span className="muted">鸽子值：{m.goose_rate}%</span><div className="action-row" style={{ marginTop: 10 }}><button className="ghost-btn" onClick={() => setSelectedTarget(m.user_id)}>选择</button><button className="action-btn" onClick={() => emitShake(m.nickname, '指定摇人', inviteDetail, 73, m.user_id)}>摇他</button><button className="ghost-btn" onClick={() => leaveGroup(activeGroup?.id ?? '')}>退出群</button></div></div>)}</div>
        </section>

        <section className="card right-panel"><div className="section-title-row"><h2>成员鸽子值</h2><span className="pill muted">越高越容易鸽</span></div><div className="member-list">{members.map((m) => <div key={m.id} className="member-item"><div className="name-row"><strong>{m.nickname}</strong><span>{m.goose_rate}%</span></div><div className="bar"><div style={{ width: `${m.goose_rate}%` }} /></div></div>)}</div><div className="tip-box">被摇时会弹出提示框，支持“接受 / 咕咕 / 稍后回复”。</div></section>
      </section>

      <section className="card invite-panel" style={{ marginTop: 18 }}><div className="section-title-row"><h2>邀请记录</h2><span className="pill">最近 {invites.length} 条</span></div><div className="invite-list">{invites.map((item) => <div key={item.id} className="invite-item"><strong>{item.detail}</strong><span className="muted">状态：{item.status} · {new Date(item.created_at).toLocaleString()}</span></div>)}</div></section>

      {modalOpen && <div className="modal-backdrop"><div className="modal card"><div className="modal-head"><h3>{modalTitle}</h3><button className="icon-btn" onClick={() => setModalOpen(false)}>×</button></div><p>{modalText}</p><div className="progress-wrap"><div className="progress-label"><span>鸽子长度</span><strong>{progress}%</strong></div><div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div><div className="modal-actions"><button className="secondary-btn" onClick={() => respondInvite('accepted')}>接受</button><button className="danger-btn" onClick={() => respondInvite('goose')}>咕咕</button><button className="ghost-btn" onClick={() => respondInvite('later')}>稍后回复</button></div></div></div>}
    </main>
  );
}
