import { ShapeFlags } from '../shared'
import { isSameVNodeType, normalizeVNode, Text } from './vnode'
import { createComponentInstance, setupComponent } from './component'
import { queueJob } from './scheduler'
import { ReactiveEffect } from '../reactivity/effect'
import { shouldUpdateComponent } from './componentRenderUtils'
import { updateProps } from './componentProps'

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    querySelector: hostQuerySelector,
    patchProp: hostPatchProp,
  } = renderOptions

  const unmount = (vnode, parentComponent) => {
    hostRemove(vnode.el)
  }

  const unmountChildren = (children, parentComponent) => {
    children.forEach((child) => {
      unmount(child, parentComponent)
    })
  }

  // Text类型处理方法
  const processText = (n1, n2, container, anchor) => {
    if (!n1) {
      // 初次渲染
      hostInsert((n2.el = hostCreateText(n2.children)), container, anchor)
    } else {
      // 更新流程
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  const mountChildren = (children, container, anchor, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i] = normalizeVNode(children[i])
      patch(null, child, container, anchor, parentComponent)
    }
  }

  // 创建一个节点，把这个节点保存在vnode.el中，然后插入到父节点中
  const mountElement = (vnode, container, anchor, parentComponent) => {
    const { type, props, children, shapeFlag } = vnode
    const el = (vnode.el = hostCreateElement(type))
    // 添加 props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    // 处理子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, null, parentComponent)
    }
    hostInsert(el, container, anchor)
  }

  const patchProps = (el, oldProps, newProps) => {
    for (const key in newProps) {
      if (oldProps[key] !== newProps[key]) {
        hostPatchProp(el, key, oldProps[key], newProps[key])
      }
    }
  }

  // 核心 diff 算法
  const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent) => {
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    let i = 0

    // sync form start
    // c1: [a, b, c]       最大索引 e1 = 2
    // c2: [a, b, c, d, e] 最大索引 e2 = 4
    // ----------------------------------
    // i = 0  e1 = 2  e2 = 4  |  a == a
    // i = 1  e1 = 2  e2 = 4  |  b == b
    // i = 2  e1 = 2  e2 = 4  |  c == c
    // i = 3  e1 = 2  e2 = 4  |    != d 退出循环
    // ----------------------------------
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      // 有可能不是vnode 需要 normalize 一下
      const n2 = c2[i] = normalizeVNode(c2[i])
      if (isSameVNodeType(n1, n2)) {
        // 相同节点 可以复用 递归对比子节点是否更新
        patch(n1, n2, container, parentAnchor, parentComponent)
      } else {
        break
      }
      i += 1
    }

    // sync form end
    // c1: [a, b, c]    最大索引 e1 = 2
    // c2: [d, e, b, c] 最大索引 e2 = 3
    // ----------------------------------
    // i = 0  e1 = 2  e2 = 3  |  c == c
    // i = 0  e1 = 1  e2 = 2  |  b == b
    // i = 0  e1 = 0  e2 = 1  |  a != e 退出循环
    // ----------------------------------
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      // 有可能不是vnode 需要 normalize 一下
      const n2 = c2[e2] = normalizeVNode(c2[e2])
      if (isSameVNodeType(n1, n2)) {
        // 相同节点 可以复用 递归对比子节点是否更新
        patch(n1, n2, container, parentAnchor, parentComponent)
      } else {
        break
      }
      e1 -= 1
      e2 -= 1
    }

    // 如果 i > e1 说明新的children有新增的元素
    // c1 = [a, b]
    // c2 = [a, b, c]
    // 执行完上面的流程之后 i = 2 e1 = 1 e2 = 2
    // i > e1 有新增元素 新增元素在 [i = 2, e2 = 2]
    if (i > e1) {
      if (i <= e2) {
        // c1 = [a, b]
        // c2 = [c, a, b]
        // 执行完上面的流程之后 i = 0 e1 = -1 e2 = 0
        // i > e1 新增元素 index = 0
        // 插入时需要参照物 插入到 nextPos 即 c2[1]
        const nextPos = e2 + 1
        const anchor = nextPos < c2.length - 1 ? c2[nextPos].el : parentAnchor
        while (i <= e2) {
          patch(null, c2[i], container, anchor)
          i += 1
        }
      }
    } else if (i > e2) {
      // 有需要删除的元素
      // c1 = [c, a, b]
      // c2 = [a, b]
      // 执行完上面的流程之后 i = 0 e1 = 0 e2 = -1
      while (i <= e1) {
        unmount(c1[i], parentComponent)
        i += 1
      }
    } else {
      // 未知序列
      // c1 = [a, b, c, d, e, f, g]
      // c2 = [a, b, e, c, d, h, f, g]
      // 执行完上面的流程之后 i = 2 e1 = 4 e2 = 5
      // c1 未知序列 [c, d, e]
      // c2 未知序列 [e, c, d, h]
      let s1 = i
      let s2 = i

      // key -> index
      const keyToNewIndexMap = new Map()
      // 先把 key 和 newIndex 绑定好，方便后续基于 key 找到 newIndex
      for (let i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(c2[i].key, i)
      }

      // 需要处理新节点的数量
      const toBePatched = e2 - s2 + 1
      // patch 过的节点数量
      let patched = 0
      // 新 index -> 老 index
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

      let moved = false
      let maxNewIndexSoFar = 0

      // 遍历老节点
      // 老节点有，而新节点没有的 -> 删除这个节点
      // 新老节点都有的—> patch
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]

        // 老的节点大于新节点的数量的话，后面的老节点全删了
        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }

        let newIndex
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 没有key 需要遍历所有的新节点来确定当前节点存在不存在
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }

        // newIndex 有可能是 0
        if (newIndex === undefined) {
          // 新节点中找不到当前节点 删掉
          hostRemove(prevChild.el)
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          // newIndex 一直是升序的那么就不用移动了
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          patch(prevChild, c2[newIndex], container, null, parentComponent)
          patched += 1
        }
      }

      // patch 完了，需要把节点移动到正确位置
      // c1 未知序列 [c, d, e]
      // c2 未知序列 [e, c, d, h]
      // 很明显 c d 是不需要移动的，只需移动 e h(新增)即可
      // 利用最长递增子序列来优化移动逻辑
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []
      // 不需要移动的有 j 个
      let j = increasingNewIndexSequence.length - 1
      // 从后往前遍历是因为需要 anchor 以便插入
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < c2.length - 1 ? c2[nextIndex + 1].el : parentAnchor
        if (newIndexToOldIndexMap[i] === 0) {
          // 新节点在老的里面不存在 新建
          patch(null, nextChild, container, anchor, parentComponent)
        } else if (moved) {
          // j 已经没有了，剩下的都需要移动了
          // 当前元素不在最长递增子序列里，需要移动
          if (j < 0 || increasingNewIndexSequence[j] !== i) {
            hostInsert(nextChild.el, container, anchor)
          } else {
            j -= 1
          }
        }
      }
    }
  }

  const patchChildren = (n1, n2, container, anchor, parentComponent) => {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag, children: c2 } = n2

    // n2 的 children 是文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // n1 的 children 是数组，需要卸载
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1, parentComponent)
      }
      // 一起处理 不一样直接替换文本
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // n2 的 children 是数组

      // 新旧孩子都是数组，diff 算法
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        patchKeyedChildren(c1, c2, container, anchor, parentComponent)
      } else {
        // 旧孩子是文本节点
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(container, '')
        }
        mountChildren(c2, container, anchor, parentComponent)
      }
    }
  }

  const patchElement = (n1, n2, container, anchor, parentComponent) => {
    const oldProps = (n1 && n1.props) || {}
    const newProps = n2.props || {}

    const el = (n2.el = n1.el)

    patchProps(el, oldProps, newProps)

    patchChildren(n1, n2, el, anchor, parentComponent)
  }

  // div span 之类的处理方法
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (!n1) {
      // 初次渲染
      mountElement(n2, container, anchor, parentComponent)
    } else {
      // 更新流程
      patchElement(n1, n2, container, anchor, parentComponent)
    }
  }

  // 调用 render，用 effect 包裹
  const setupRenderEffect = (instance, vnode, container, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const proxyToUse = instance.proxy
        const subTree = (instance.subTree = normalizeVNode(instance.render.call(proxyToUse)))

        // TODO beforeMount hook
        console.log(`beforeMount: ${instance.type.name}`)

        patch(null, subTree, container, anchor, instance)

        vnode.el = subTree.el

        // TODO mounted hook
        console.log(`mounted: ${instance.type.name}`)
        instance.isMounted = true
      } else {
        // 有 next 的话，说明需要更新组件的 props slots 等
        const { next, vnode } = instance
        if (next) {
          next.el = vnode.el
          const preProps = instance.vnode.props || {}
          instance.vnode = next
          instance.next = null
          updateProps(instance, next.props, preProps)
        }

        const proxyToUse = instance.proxy
        const nextTree = normalizeVNode(instance.render.call(proxyToUse))

        const prevTree = instance.subTree
        instance.subTree = nextTree

        // TODO beforeUpdated hook
        console.log(`beforeUpdated: ${instance.type.name}`)

        patch(prevTree, nextTree, container, anchor, instance)

        // TODO updated hook
        console.log(`updated: ${instance.type.name}`)
      }
    }

    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update))

    const update = (instance.update = effect.run.bind(effect))
    update()
  }

  const mountComponent = (vnode, container, anchor, parentComponent) => {
    // 创建实例，并且保存到 vnode.component 中
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent))

    setupComponent(instance)

    setupRenderEffect(instance, vnode, container, anchor)
  }

  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component)

    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    } else {
      n2.component = n1.component
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  // 组件的处理方法
  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (!n1) {
      // 初次渲染
      mountComponent(n2, container, anchor, parentComponent)
    } else {
      // 更新流程
      updateComponent(n1, n2)
    }
  }

  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    // n1 和 n2 不相等 那么直接卸载n1
    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1, parentComponent)
      // 需要把 n1 置为 null 后面重新创建节点
      n1 = null
    }

    // n2是新的vnode, 基于n2的类型来判断
    const { type, shapeFlag } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent)
        }
        break
    }
  }

  const render = (vnode, container) => {
    patch(null, vnode, container)
  }

  return {
    render,
    patch,
  }
}

// 求最长递增子序列
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
