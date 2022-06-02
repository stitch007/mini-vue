import { isArray, isString, ShapeFlags } from '../shared'

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export function isVNode(value: any): boolean {
  return !!(value && value.__v_isVNode)
}

export function isSameVNodeType(n1, n2): boolean {
  return n1.type === n2.type && n1.key === n2.key
}

export function createVNode(type: any, props?: any, children?: string | any[]) {
  const shapeFlag = (isString(type)
      ? ShapeFlags.ELEMENT
      : ShapeFlags.STATEFUL_COMPONENT)
    | (isArray(children)
      ? ShapeFlags.ARRAY_CHILDREN
      : ShapeFlags.TEXT_CHILDREN)

  return {
    __v_isVNode: true,
    type,
    key: props?.key,
    el: null,
    props: props || null,
    children,
    shapeFlag,
  }
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
