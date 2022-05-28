import { isArray, isString, ShapeFlags } from '../shared'

export const Text = Symbol('Text')

export function isVNode(value: any): boolean {
  return !!(value && value.__v_isVNode)
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
export function createTextVNode(text: string = " ") {
  return createVNode(Text, {}, text)
}
