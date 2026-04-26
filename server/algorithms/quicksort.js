function cloneArray(arr) {
  return JSON.parse(JSON.stringify(arr));
}

function createStep(stepId, array, description, extra = {}) {
  return {
    stepId,
    algorithm: "quicksort",
    array: cloneArray(array),
    description,
    ...extra
  };
}

function generateQuickSortSteps(input) {
  const arr = [...input];
  const steps = [];
  let stepId = 0;

  steps.push(
    createStep(stepId++, arr, "初始数组已生成，准备开始快速排序")
  );

  function partition(low, high) {
    const pivot = arr[high];
    let i = low - 1;

    steps.push(
      createStep(stepId++, arr, `选择 ${pivot} 作为本轮分区基准值`, {
        pivot: high,
        range: [low, high]
      })
    );

    for (let j = low; j < high; j++) {
      steps.push(
        createStep(stepId++, arr, `比较 ${arr[j]} 与基准值 ${pivot}`, {
          active: [j],
          pivot: high,
          range: [low, high]
        })
      );

      if (arr[j] < pivot) {
        i++;

        if (i !== j) {
          steps.push(
            createStep(stepId++, arr, `将较小元素 ${arr[j]} 交换到左侧区域`, {
              swap: [i, j],
              pivot: high,
              range: [low, high]
            })
          );

          [arr[i], arr[j]] = [arr[j], arr[i]];

          steps.push(
            createStep(stepId++, arr, "交换完成，继续扫描", {
              pivot: high,
              range: [low, high]
            })
          );
        }
      }
    }

    if (i + 1 !== high) {
      steps.push(
        createStep(stepId++, arr, `将基准值 ${pivot} 放入最终位置`, {
          swap: [i + 1, high],
          pivot: high,
          range: [low, high]
        })
      );

      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    }

    steps.push(
      createStep(stepId++, arr, `本轮分区完成，基准值最终位置为 ${i + 1}`, {
        pivotDone: i + 1,
        range: [low, high]
      })
    );

    return i + 1;
  }

  function quickSort(low, high) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    }
  }

  quickSort(0, arr.length - 1);

  steps.push(
    createStep(stepId++, arr, "快速排序完成", {
      finished: true
    })
  );

  return steps;
}

module.exports = { generateQuickSortSteps };