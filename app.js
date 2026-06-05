const ws = new WebSocket(`ws://${location.host}`);
let state = { groups: [], messages: [] };

const groupList = document.getElementById('groupList');
const memberList = document.getElementById('memberList');
const chatWindow = document.getElementById('chatWindow');
const activeGroupTitle = document.getElementById('activeGroupTitle');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalText = document.getElementById('modalText');
const modalTitle = document.getElementById('modalTitle');
const progressValue = document.getElementById('progressValue');
const progressFill = document.getElementById('progressFill');

const members = [
  { name: '阿飞', rate: 92 },
  { name: '小鱼', rate: 61 },
  { name: 'Luna', rate: 34 },
  { name: '老王', rate: 77 },
  { name: '米粒', rate: 48 },
];

function renderGroups() {
  groupList.innerHTML = state.groups.map((g) => `
    <div class="group-item ${g.active ? 'active' : ''}" data-id="${g.id}">
      <div class="name-row">
        <strong>${g.name}</strong>
        <span>${g.count}人</span>
      </div>
      <div class="muted">点击进入群聊 / 群摇人</div>
    </div>
  `).join('');

  activeGroupTitle.textContent = state.groups.find((g) => g.active)?.name || '鸽子群';

  document.querySelectorAll('.group-item').forEach((item) => {
    item.addEventListener('click', () => {
      ws.send(JSON.stringify({ type: 'switch-group', id: item.dataset.id }));
    });
  });
}

function renderMembers() {
  memberList.innerHTML = members.map((m) => `
    <div class="member-item">
      <div class="name-row">
        <strong>${m.name}</strong>
        <span>${m.rate}%</span>
      </div>
      <div class="bar"><div style="width:${m.rate}%"></div></div>
    </div>
  `).join('');
}

function renderMessages() {
  chatWindow.innerHTML = state.messages.map((m) => `
    <div class="message ${m.type === 'self' ? 'self' : m.type === 'system' ? 'system' : ''}">
      <div class="message-head">
        <strong>${m.author}</strong>
        <span>${m.type === 'system' ? '提示' : '刚刚'}</span>
      </div>
      <div>${m.text}</div>
    </div>
  `).join('');
}

function renderAll() {
  renderGroups();
  renderMembers();
  renderMessages();
}

function openShakePopup(name = '阿飞', reason = '今晚 8 点开黑，缺一个人，快来！', rate = 68) {
  modalTitle.textContent = `${name}，你被摇了`;
  modalText.textContent = reason;
  progressValue.textContent = `${rate}%`;
  progressFill.style.width = `${rate}%`;
  modalBackdrop.classList.remove('hidden');
}

ws.addEventListener('message', (event) => {
  const payload = JSON.parse(event.data);
  if (payload.type === 'state') {
    state = payload.state;
    renderAll();
  }
});

ws.addEventListener('open', () => {
  console.log('已连接到鸽子侠服务器');
});

document.getElementById('createGroupBtn').addEventListener('click', () => {
  document.getElementById('createGroupForm').classList.toggle('hidden');
});

document.getElementById('confirmCreateGroupBtn').addEventListener('click', () => {
  const input = document.getElementById('groupNameInput');
  const name = input.value.trim();
  if (!name) return;
  ws.send(JSON.stringify({ type: 'create-group', name }));
  input.value = '';
});

document.getElementById('groupShakeBtn').addEventListener('click', () => {
  openShakePopup('全体成员', '群里发起了群摇人：今晚 8 点来打两把，缺人速来。', 54);
});

document.getElementById('pickShakeBtn').addEventListener('click', () => {
  openShakePopup('小鱼', '有人点名召唤你去吃饭，收到请回复。', 73);
});

document.getElementById('progressBtn').addEventListener('click', () => {
  openShakePopup('鸽子长度', '你当前的鸽子长度已更新，可在这里查看进度条。', 88);
});

document.getElementById('closeModalBtn').addEventListener('click', () => modalBackdrop.classList.add('hidden'));
document.getElementById('laterBtn').addEventListener('click', () => modalBackdrop.classList.add('hidden'));

document.getElementById('acceptBtn').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'system-message', text: '你已接受邀请，准备赴约。' }));
  modalBackdrop.classList.add('hidden');
});

document.getElementById('gooseBtn').addEventListener('click', () => {
  ws.send(JSON.stringify({ type: 'system-message', text: '你选择了咕咕，鸽子飞走了。' }));
  modalBackdrop.classList.add('hidden');
});

document.getElementById('sendBtn').addEventListener('click', () => {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text) return;
  ws.send(JSON.stringify({ type: 'send-message', text, author: '你' }));
  input.value = '';
});

document.getElementById('messageInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('sendBtn').click();
});
