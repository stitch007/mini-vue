import { isArray, isObject, isString, ShapeFlags } from '../shared'

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function isVNode(value: any): boolean {
  return !!(value && value.__v_isVNode)
}

export function isSameVNodeType(n1, n2): boolean {
  return n1.type === n2.type && n1.key === n2.key
}

export function createVNode(type, props?, children?) {
  const vnode = {
    __v_isVNode: true,
    type,
    key: props?.key,
    el: null, // vnode 对应的真是 dom
    component: null, // 组件的 instance
    props: props || {},
    children,
    shapeFlag: 0,
  }

  if (isObject(type)) {
    vnode.shapeFlag |= ShapeFlags.STATEFUL_COMPONENT
  } else if (isString(type)) {
    vnode.shapeFlag |= ShapeFlags.ELEMENT
  }

  if (isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  } else if (isObject(children)) {
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {

    } else {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    }
  } else {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  }

  return vnode
}

export { createVNode as createElementVNode }

export function createTextVNode(text = ' ') {
  return createVNode(Text, {}, text)
}

export function normalizeVNode(child) {
  if (isString(child)) {
    return createTextVNode(child)
  } else if (isArray(child)) {
    return createVNode(Fragment, {}, child.slice())
  }
  return child
}
