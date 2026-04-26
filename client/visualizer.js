function clearSVG(svg) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function createSVGElement(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const key in attrs) el.setAttribute(key, attrs[key]);
  return el;
}

function getNodeColor(index, step) {
  if (step.swap?.includes(index)) return "#ff9f0a";
  if (step.compare?.includes(index)) return "#ffd60a";
  if (step.active?.includes(index)) return "#ff2d55";
  if (step.done?.includes(index)) return "#34c759";
  if (step.pivot === index) return "#5856d6";
  if (step.pivotDone === index) return "#34c759";
  return "#e5e7eb";
}

function drawHeap(svg, step) {
  clearSVG(svg);

  const arr = step.array;
  const positions = [
    [500, 62],
    [300, 150], [700, 150],
    [190, 260], [410, 260], [590, 260], [810, 260],
    [120, 370], [260, 370]
  ];

  for (let i = 0; i < arr.length; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < arr.length) {
      svg.appendChild(createSVGElement("line", {
        x1: positions[i][0],
        y1: positions[i][1],
        x2: positions[left][0],
        y2: positions[left][1],
        stroke: "rgba(107,114,128,0.5)",
        "stroke-width": 3,
        "stroke-linecap": "round"
      }));
    }

    if (right < arr.length) {
      svg.appendChild(createSVGElement("line", {
        x1: positions[i][0],
        y1: positions[i][1],
        x2: positions[right][0],
        y2: positions[right][1],
        stroke: "rgba(107,114,128,0.5)",
        "stroke-width": 3,
        "stroke-linecap": "round"
      }));
    }
  }

  for (let i = 0; i < arr.length; i++) {
    const [x, y] = positions[i];
    const fill = getNodeColor(i, step);

    svg.appendChild(createSVGElement("circle", {
      cx: x,
      cy: y,
      r: 32,
      fill,
      stroke: "white",
      "stroke-width": 5
    }));

    const text = createSVGElement("text", {
      x,
      y: y + 7,
      "text-anchor": "middle",
      "font-size": 19,
      "font-weight": 800,
      fill: fill === "#e5e7eb" || fill === "#ffd60a" ? "#111827" : "white"
    });

    text.textContent = arr[i];
    svg.appendChild(text);

    const indexText = createSVGElement("text", {
      x,
      y: y + 52,
      "text-anchor": "middle",
      "font-size": 12,
      fill: "#9ca3af"
    });

    indexText.textContent = `idx ${i}`;
    svg.appendChild(indexText);
  }
}

function drawQuickSort(svg, step) {
  clearSVG(svg);

  const arr = step.array;
  const maxValue = Math.max(...arr.map((v) => Math.abs(v)), 1);
  const width = Math.min(70, 760 / arr.length);
  const gap = 16;
  const baseY = 380;
  const startX = 80;

  for (let i = 0; i < arr.length; i++) {
    const x = startX + i * (width + gap);
    const barHeight = Math.max(20, Math.abs(arr[i]) / maxValue * 260);
    const y = baseY - barHeight;
    const fill = getNodeColor(i, step);

    svg.appendChild(createSVGElement("rect", {
      x,
      y,
      width,
      height: barHeight,
      rx: 14,
      fill,
      stroke: "white",
      "stroke-width": 4
    }));

    const valueText = createSVGElement("text", {
      x: x + width / 2,
      y: y - 10,
      "text-anchor": "middle",
      "font-size": 15,
      "font-weight": 800,
      fill: "#111827"
    });

    valueText.textContent = arr[i];
    svg.appendChild(valueText);

    const indexText = createSVGElement("text", {
      x: x + width / 2,
      y: baseY + 25,
      "text-anchor": "middle",
      "font-size": 12,
      fill: "#9ca3af"
    });

    indexText.textContent = i;
    svg.appendChild(indexText);
  }
}

function renderStep(svg, step) {
  if (step.algorithm === "heap") {
    drawHeap(svg, step);
  } else if (step.algorithm === "quicksort") {
    drawQuickSort(svg, step);
  }
}

export {
  renderStep,
  clearSVG
};