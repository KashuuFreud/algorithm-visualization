function cloneArray(arr) {
  return JSON.parse(JSON.stringify(arr));
}

function createStep(stepId, array, description, extra = {}) {
  return {
    stepId,
    algorithm: "heap",
    array: cloneArray(array),
    description,
    ...extra
  };
}

function generateHeapSteps(input) {
  const arr = [...input];
  const steps = [];
  let stepId = 0;

  steps.push(
    createStep(stepId++, arr, "初始数组已生成，准备从最后一个非叶子节点开始构建大根堆")
  );

  function heapify(n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    steps.push(
      createStep(stepId++, arr, `开始调整索引 ${i} 对应的子树`, {
        active: [i]
      })
    );

    if (left < n) {
      steps.push(
        createStep(stepId++, arr, `比较父节点 ${arr[i]} 与左孩子 ${arr[left]}`, {
          active: [i],
          compare: [left]
        })
      );

      if (arr[left] > arr[largest]) {
        largest = left;
      }
    }

    if (right < n) {
      steps.push(
        createStep(stepId++, arr, `比较当前最大节点 ${arr[largest]} 与右孩子 ${arr[right]}`, {
          active: [largest],
          compare: [right]
        })
      );

      if (arr[right] > arr[largest]) {
        largest = right;
      }
    }

    if (largest !== i) {
      steps.push(
        createStep(stepId++, arr, `需要交换 ${arr[i]} 和 ${arr[largest]}`, {
          active: [i, largest],
          swap: [i, largest]
        })
      );

      [arr[i], arr[largest]] = [arr[largest], arr[i]];

      steps.push(
        createStep(stepId++, arr, "交换完成，继续向下调整受影响的子树", {
          active: [largest]
        })
      );

      heapify(n, largest);
    } else {
      steps.push(
        createStep(stepId++, arr, `索引 ${i} 的子树已经满足大根堆性质`, {
          done: [i]
        })
      );
    }
  }

  for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
    steps.push(
      createStep(stepId++, arr, `当前处理最后一个非叶子节点序列中的索引 ${i}`, {
        active: [i]
      })
    );

    heapify(arr.length, i);
  }

  steps.push(
    createStep(stepId++, arr, "大根堆创建完成", {
      finished: true
    })
  );

  return steps;
}

module.exports = { generateHeapSteps };