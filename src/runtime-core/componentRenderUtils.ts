export function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps } = prevVNode
  const { props: nextProps } = nextVNode

  // props 没变化不用更新
  if (prevProps === nextProps) {
    return false
  }

  // 之前没有 props，那就看现在有没有 props
  if (!prevProps) {
    return !!nextProps
  }

  // 之前有值，现在没值，需要更新
  if (!nextProps) {
    return true
  }

  return hasPropsChanged(prevProps, nextProps)
}

function hasPropsChanged(prevProps, nextProps) {
  // length 不一样需要更新
  const nextKeys = Object.keys(nextProps)

  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }

  // 依次对比每个 key
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }

  return false
}
