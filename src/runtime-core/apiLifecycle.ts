import { getCurrentInstance, LifecycleHooks } from './component'

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)

function createHook(lifecycle) {
  return (hook, target = getCurrentInstance()) => injectHook(lifecycle, hook, target)
}

function injectHook(lifecycle, hook, target) {
  // 生命周期 hook 放在实例上，可以有多个 onMounted
  const hooks = target[lifecycle] || (target[lifecycle] = [])
  if (hooks) {
    hooks.push(hook)
  }
}
