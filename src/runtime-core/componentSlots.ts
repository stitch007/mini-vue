import { isArray, isFunction, ShapeFlags } from '../shared'

export function initSlots(instance, children) {
  const { vnode } = instance

  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(rawSlots, slots) {
  for (const key in rawSlots) {
    const value = rawSlots[key]
    if (isFunction(value)) {
      slots[key] = (props) => normalizeSlotValue(value(props))
    }
  }
}

function normalizeSlotValue(value) {
  return isArray(value) ? value : [value]
}
