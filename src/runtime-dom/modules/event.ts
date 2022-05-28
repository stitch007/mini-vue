function createInvoker(cb) {
  // 把
  const invoker = (e) => invoker.value(e)
  invoker.value = cb
  return invoker
}

// 利用invokers做缓存，这样每次更新只需要替换invoker.value即可，不需要remove后再add
export function patchEvent(el, key, cb) {
  // 在元素上存下invokers
  const invokers = el._vei || (el._vei = {})
  const exitingInvoker = invokers[key]
  // cb不为空且存在invoker，直接替换invoker.value即可
  if (cb && exitingInvoker) {
    exitingInvoker.value = cb
  } else {
    const eventName = key.slice(2).toLowerCase()
    if (cb) {
      invokers[key] = createInvoker(cb)
      el.addEventListener(eventName, invokers[key])
    } else {
      el.removeEventListener(eventName, exitingInvoker)
      invokers[key] = undefined
    }
  }
}
