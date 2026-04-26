function validateInput(data, algorithm) {
  if (!Array.isArray(data)) {
    return { ok: false, message: "输入必须是数组格式" };
  }

  if (data.length === 0) {
    return { ok: false, message: "输入不能为空" };
  }

  if (!data.every((item) => Number.isInteger(item))) {
    return { ok: false, message: "请输入整数，不能包含小数、字母或特殊字符" };
  }

  if (algorithm === "heap" && data.length !== 9) {
    return { ok: false, message: "堆创建演示要求输入 9 个整数" };
  }

  if (algorithm === "quicksort" && data.length < 2) {
    return { ok: false, message: "快速排序至少需要输入 2 个整数" };
  }

  return { ok: true };
}

module.exports = { validateInput };
