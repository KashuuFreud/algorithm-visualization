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
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const statusText = document.getElementById("statusText");
const stepText = document.getElementById("stepText");
const svgCanvas = document.getElementById("svgCanvas");

let stepList = [];
let currentStepIndex = -1;
let autoPlayTimer = null;
let isPlaying = false;

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
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }

  if (state === "running") {
    submitBtn.disabled = true;
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
    prevBtn.disabled = currentStepIndex <= 0;
    nextBtn.disabled = currentStepIndex >= stepList.length - 1;
  }

  if (state === "paused") {
    submitBtn.disabled = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
    prevBtn.disabled = currentStepIndex <= 0;
    nextBtn.disabled = currentStepIndex >= stepList.length - 1;
  }

  if (state === "finished") {
    submitBtn.disabled = false;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    prevBtn.disabled = currentStepIndex <= 0;
    nextBtn.disabled = currentStepIndex >= stepList.length - 1;
  }
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }

  isPlaying = false;
}

function showStep(index) {
  if (index < 0 || index >= stepList.length) return;

  currentStepIndex = index;

  const step = stepList[currentStepIndex];
  renderStep(svgCanvas, step);

  const description = step.description || "正在执行算法步骤";
  setStep(`第 ${currentStepIndex + 1} / ${stepList.length} 步：${description}`);

  if (currentStepIndex >= stepList.length - 1) {
    stopAutoPlay();
    setStatus("演示完成");
    updateButtons("finished");
  } else {
    updateButtons(isPlaying ? "running" : "paused");
  }
}

function nextStep() {
  if (currentStepIndex < stepList.length - 1) {
    showStep(currentStepIndex + 1);
  }
}

function prevStep() {
  if (currentStepIndex > 0) {
    showStep(currentStepIndex - 1);
  }
}

function startAutoPlay() {
  stopAutoPlay();

  if (stepList.length === 0) {
    setStatus("暂无可播放的步骤");
    return;
  }

  isPlaying = true;
  setStatus("自动演示中");
  updateButtons("running");

  if (currentStepIndex === -1) {
    showStep(0);
  }

  autoPlayTimer = setInterval(() => {
    if (currentStepIndex >= stepList.length - 1) {
      stopAutoPlay();
      setStatus("演示完成");
      updateButtons("finished");
      return;
    }

    nextStep();
  }, Number(speedSelect.value));
}

function resetLocalState() {
  stopAutoPlay();
  stepList = [];
  currentStepIndex = -1;

  clearSVG(svgCanvas);
  setStep("尚未开始演示");
  updateButtons("idle");
}

initSocket((data) => {
  if (data.type === "step") {
    stepList.push(data.payload);

    if (stepList.length === 1) {
      showStep(0);
      startAutoPlay();
    }

    setStatus(`已接收 ${stepList.length} 个步骤`);
  }

  if (data.type === "steps") {
    stepList = data.steps || [];

    if (stepList.length === 0) {
      setStatus("后端未返回有效步骤");
      updateButtons("idle");
      return;
    }

    currentStepIndex = -1;
    setStatus(`已接收完整步骤，共 ${stepList.length} 步`);
    startAutoPlay();
  }

  if (data.type === "done") {
    setStatus("后端步骤推送完成，可继续单步查看或回溯");
  }

  if (data.type === "paused") {
    setStatus("演示已暂停");
  }

  if (data.type === "resumed") {
    setStatus("演示继续中");
  }

  if (data.type === "reset_ack") {
    setStatus("系统已重置");
    resetLocalState();
  }

  if (data.type === "error") {
    setStatus("错误：" + data.message);
    resetLocalState();
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

    resetLocalState();

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
      updateButtons("idle");
      return;
    }

    setStatus(`数据校验通过，共生成 ${result.totalSteps} 个演示步骤`);
    setStep("准备开始接收算法步骤");

    sendSocketMessage({
      type: "start",
      speed: Number(speedSelect.value)
    });

    updateButtons("running");
  } catch (error) {
    alert(error.message);
    updateButtons("idle");
  }
});

pauseBtn.addEventListener("click", () => {
  stopAutoPlay();

  sendSocketMessage({
    type: "pause"
  });

  setStatus("演示已暂停，可使用“上一步 / 下一步”手动观察");
  updateButtons("paused");
});

resumeBtn.addEventListener("click", () => {
  sendSocketMessage({
    type: "resume"
  });

  startAutoPlay();
});

nextBtn.addEventListener("click", () => {
  stopAutoPlay();
  nextStep();
  setStatus("单步执行：已前进到下一步");
  updateButtons("paused");
});

prevBtn.addEventListener("click", () => {
  stopAutoPlay();
  prevStep();
  setStatus("回溯执行：已返回到上一步");
  updateButtons("paused");
});

resetBtn.addEventListener("click", () => {
  inputData.value = "";

  sendSocketMessage({
    type: "reset"
  });

  resetLocalState();
  setStatus("系统已重置");
});

algorithmSelect.addEventListener("change", () => {
  if (algorithmSelect.value === "heap") {
    inputData.placeholder = "20,15,8,10,5,7,6,2,9";
  }

  if (algorithmSelect.value === "quicksort") {
    inputData.placeholder = "9,4,7,2,8,1,6";
  }
});

updateButtons("idle");
