import { createVNode, Fragment } from '../vnode'

export function renderSlots(slots, name, props) {
  const slot = slots[name]
  debugger
  if (slot) {
    const slotContent = slot(props)
    return createVNode(Fragment, {}, slotContent)
  }
}
