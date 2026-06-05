import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(process.cwd()));

const state = {
  groups: [
    { id: crypto.randomUUID(), name: '周末开黑群', count: 8, active: true },
    { id: crypto.randomUUID(), name: '饭搭子鸽群', count: 12, active: false },
    { id: crypto.randomUUID(), name: '摸鱼召唤室', count: 6, active: false },
  ],
  messages: [
    { type: 'system', author: '系统', text: '今天 20:00 有一场群摇人，记得准备好你的鸽子长度。' },
    { type: 'self', author: '你', text: '今晚开黑，缺一个辅助。谁来？' },
    { type: 'normal', author: '阿飞', text: '我先看下，别急着点名我。' },
    { type: 'normal', author: '小鱼', text: '我可以，但如果太晚我可能会咕。' },
  ],
};

function broadcast() {
  const payload = JSON.stringify({ type: 'state', state });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', state }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'create-group' && msg.name) {
        state.groups.forEach((g) => (g.active = false));
        state.groups.unshift({ id: crypto.randomUUID(), name: msg.name, count: 1, active: true });
      }
      if (msg.type === 'switch-group' && msg.id) {
        state.groups.forEach((g) => (g.active = g.id === msg.id));
      }
      if (msg.type === 'send-message' && msg.text) {
        state.messages.unshift({ type: 'self', author: msg.author || '你', text: msg.text });
      }
      if (msg.type === 'system-message' && msg.text) {
        state.messages.unshift({ type: 'system', author: '系统', text: msg.text });
      }
      broadcast();
    } catch {
      // ignore malformed payloads
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`鸽子侠运行中 http://localhost:${port}`);
});
