let ws = null;
let currentClientId = null;

function initSocket(onMessage, onStatus) {
  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    onStatus("WebSocket 连接已建立，等待后端分配会话编号");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "connected") {
      currentClientId = data.clientId;
      onStatus(`连接成功：${currentClientId}`);
    }

    onMessage(data);
  };

  ws.onerror = () => {
    onStatus("WebSocket 连接失败，请确认后端 server.js 已启动");
  };

  ws.onclose = () => {
    onStatus("WebSocket 连接已关闭");
  };
}

function sendSocketMessage(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function getClientId() {
  return currentClientId;
}

export {
  initSocket,
  sendSocketMessage,
  getClientId
};