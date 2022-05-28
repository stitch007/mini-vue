import { createVNode, isVNode } from './vnode'
import { isArray, isObject } from '../shared'

export function h(type: any, propsOrChildren?: any, children?: any) {
  const l = arguments.length
  if (l === 2) {
    // 两个参数，第二个参数是 props 或 children
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // // h('div', h(?))，children 需要用数组包裹起来
        return createVNode(type, null, [propsOrChildren])
      }
      // h('div', { id: 'foo' })
      return createVNode(type, propsOrChildren)
    } else {
      // h('div', [h(?), h(?)])
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      // 不支持 h('div', {}, h(?), h(?))，这里写上是为了和 vue 保持一致
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      // h('div', { id: 'foo' }, h(?))
      children = [children]
    }
    // h('div', { id: 'foo' }, [h(?), h(?)])
    return createVNode(type, propsOrChildren, children)
  }
}
