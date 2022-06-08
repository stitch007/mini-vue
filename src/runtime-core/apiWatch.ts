import { ReactiveEffect } from '../reactivity/effect'
import { isFunction, isObject } from '../shared'

export function watch(source, cb) {
  let getter

  if (isFunction(source)) {
    // watch(() => data.a.a, cb)
    getter = source
  } else {
    // watch(data.a, cb)
    getter = () => traverse(source)
  }

  let oldValue

  // 下一次执行前执行下 cleanup
  // watch(() => data.abc, async (newVal, oldVal, onCleanup) => {
  //   let flag = false
  //   onCleanup(() => flag = true)
  //   const res = await getData()
  //   if (!flag) {
  //     document.body.innerHTML = res
  //   }
  // })
  // 第一次调用 watch 的时候注入 cleanup 回调
  // 第二次调用 watch 的时候执行 cleanup 回调，此时上一次的 flag 被改为 true
  let cleanup
  const onCleanup = (fn) => {
    cleanup = fn
  }

  // 响应式依赖发生变化执行
  const job = () => {
    cleanup && cleanup()

    // 执行 getter 函数获得结果
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter, job)
  // 先执行一次 getter 获得 oldValue
  oldValue = effect.run()
}

function traverse(value, seen = new Set()) {
  if (!isObject(value) || seen.has(value)) {
    return value
  }

  // 防止循环引用
  seen.add(value)

  // 递归遍历子元素
  for (const key in value) {
    traverse(value[key])
  }
  return value
}
