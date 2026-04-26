import {
  initSocket,
  sendSocketMessage,
  getClientId
} from "./socket.js";

import {
  renderStep,
  clearSVG
} from "./visualizer.js";

const algorithmSelect = document.getElementById("algorithmSelect");
const inputData = document.getElementById("inputData");
const speedSelect = document.getElementById("speedSelect");

const submitBtn = document.getElementById("submitBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const resetBtn = document.getElementById("resetBtn");

const statusText = document.getElementById("statusText");
const stepText = document.getElementById("stepText");
const svgCanvas = document.getElementById("svgCanvas");

function setStatus(message) {
  statusText.textContent = message;
}

function setStep(message) {
  stepText.textContent = message;
}

function parseInput(text) {
  const result = text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item));

  if (result.length === 0) {
    throw new Error("输入不能为空");
  }

  if (result.some((num) => !Number.isInteger(num))) {
    throw new Error("请输入英文逗号分隔的整数，例如：20,15,8,10,5,7,6,2,9");
  }

  return result;
}

function updateButtons(state) {
  if (state === "idle") {
    submitBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
  }

  if (state === "running") {
    submitBtn.disabled = true;
    pauseBtn.disabled = false;
    resumeBtn.disabled = false;
  }

  if (state === "finished") {
    submitBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
  }
}

initSocket((data) => {
  if (data.type === "step") {
    renderStep(svgCanvas, data.payload);
    setStep(data.payload.description);
  }

  if (data.type === "done") {
    setStatus("演示完成");
    updateButtons("finished");
  }

  if (data.type === "paused") {
    setStatus("演示已暂停");
  }

  if (data.type === "resumed") {
    setStatus("演示继续中");
  }

  if (data.type === "reset_ack") {
    setStatus("系统已重置");
    setStep("尚未开始演示");
    clearSVG(svgCanvas);
    updateButtons("idle");
  }

  if (data.type === "error") {
    setStatus("错误：" + data.message);
    updateButtons("idle");
  }
}, setStatus);

submitBtn.addEventListener("click", async () => {
  try {
    const clientId = getClientId();

    if (!clientId) {
      alert("WebSocket 尚未连接成功，请确认后端服务已启动");
      return;
    }

    const algorithm = algorithmSelect.value;
    const data = parseInput(inputData.value);

    const response = await fetch("http://localhost:3000/api/prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        clientId,
        algorithm,
        data
      })
    });

    const result = await response.json();

    if (!result.ok) {
      alert(result.message);
      return;
    }

    setStatus(`数据校验通过，共生成 ${result.totalSteps} 个演示步骤`);
    setStep("准备开始推送算法步骤");

    clearSVG(svgCanvas);

    sendSocketMessage({
      type: "start",
      speed: Number(speedSelect.value)
    });

    updateButtons("running");
  } catch (error) {
    alert(error.message);
  }
});

pauseBtn.addEventListener("click", () => {
  sendSocketMessage({
    type: "pause"
  });
});

resumeBtn.addEventListener("click", () => {
  sendSocketMessage({
    type: "resume"
  });
});

resetBtn.addEventListener("click", () => {
  inputData.value = "";

  sendSocketMessage({
    type: "reset"
  });

  clearSVG(svgCanvas);
  setStep("尚未开始演示");
  updateButtons("idle");
});

algorithmSelect.addEventListener("change", () => {
  if (algorithmSelect.value === "heap") {
    inputData.placeholder = "20,15,8,10,5,7,6,2,9";
  }

  if (algorithmSelect.value === "quicksort") {
    inputData.placeholder = "9,4,7,2,8,1,6";
  }
});