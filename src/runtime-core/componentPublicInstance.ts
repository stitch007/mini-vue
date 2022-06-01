import { hasOwn } from '../shared'

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $emit: (i) => i.emit,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
}

export const PublicInstanceProxyHandlers = {
  // target: instance.ctx
  get({ _: instance }, key) {
    const { setupState, props } = instance

    if (key[0] !== '$') {
      if (hasOwn(setupState, key)) {
        return setupState[key]
      } else if (hasOwn(props, key)) {
        return props[key]
      }
    }

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },

  // target: instance.ctx
  set({ _: instance }, key, value) {
    const { setupState, props } = instance

    if (setupState !== {} && hasOwn(setupState, key)) {
      setupState[key] = value
      return true
    } else if (props !== {} && hasOwn(props, key)) {
      console.warn(`Attempting to mutate prop "${key}". Props are readonly.`, instance)
      return false
    }

    return true
  },
}
