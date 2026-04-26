const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const { validateInput } = require("./utils/validator");
const { generateHeapSteps } = require("./algorithms/heap");
const { generateQuickSortSteps } = require("./algorithms/quicksort");
const {
  createSession,
  getSession,
  removeSession
} = require("./sessionManager");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clientCounter = 1;

function sendJson(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

app.post("/api/prepare", (req, res) => {
  try {
    const { clientId, algorithm, data } = req.body;

    if (!clientId) {
      return res.status(400).json({
        ok: false,
        message: "缺少 clientId，请刷新页面重新连接"
      });
    }

    const session = getSession(clientId);

    if (!session) {
      return res.status(400).json({
        ok: false,
        message: "会话不存在，请刷新页面重新连接"
      });
    }

    const check = validateInput(data, algorithm);

    if (!check.ok) {
      return res.status(400).json({
        ok: false,
        message: check.message
      });
    }

    let steps = [];

    if (algorithm === "heap") {
      steps = generateHeapSteps(data);
    } else if (algorithm === "quicksort") {
      steps = generateQuickSortSteps(data);
    } else {
      return res.status(400).json({
        ok: false,
        message: "不支持的算法类型"
      });
    }

    if (session.timer) {
      clearInterval(session.timer);
      session.timer = null;
    }

    session.steps = steps;
    session.currentIndex = 0;
    session.paused = false;

    return res.json({
      ok: true,
      message: "算法步骤已生成",
      totalSteps: steps.length
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "服务器内部错误：" + error.message
    });
  }
});

wss.on("connection", (ws) => {
  const clientId = `client_${clientCounter++}`;
  ws.clientId = clientId;

  createSession(clientId);

  sendJson(ws, {
    type: "connected",
    clientId,
    message: "WebSocket 连接成功"
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      const session = getSession(ws.clientId);

      if (!session) {
        sendJson(ws, {
          type: "error",
          message: "当前会话不存在"
        });
        return;
      }

      if (data.type === "start") {
        if (!session.steps || session.steps.length === 0) {
          sendJson(ws, {
            type: "error",
            message: "没有可演示的步骤，请先提交数据"
          });
          return;
        }

        if (session.timer) {
          clearInterval(session.timer);
        }

        const speed = data.speed || 1000;

        session.timer = setInterval(() => {
          if (session.paused) {
            return;
          }

          if (session.currentIndex < session.steps.length) {
            sendJson(ws, {
              type: "step",
              payload: session.steps[session.currentIndex]
            });

            session.currentIndex++;
          } else {
            clearInterval(session.timer);
            session.timer = null;

            sendJson(ws, {
              type: "done",
              message: "演示完成"
            });
          }
        }, speed);
      }

      if (data.type === "pause") {
        session.paused = true;

        sendJson(ws, {
          type: "paused",
          message: "演示已暂停"
        });
      }

      if (data.type === "resume") {
        session.paused = false;

        sendJson(ws, {
          type: "resumed",
          message: "演示已继续"
        });
      }

      if (data.type === "reset") {
        if (session.timer) {
          clearInterval(session.timer);
          session.timer = null;
        }

        session.steps = [];
        session.currentIndex = 0;
        session.paused = false;

        sendJson(ws, {
          type: "reset_ack",
          message: "系统已重置"
        });
      }
    } catch (error) {
      sendJson(ws, {
        type: "error",
        message: "WebSocket 消息处理失败：" + error.message
      });
    }
  });

  ws.on("close", () => {
    removeSession(ws.clientId);
  });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});