import { camelize, toHandlerKey } from "../shared"

export function emit(instance, event: string, ...args) {
  const props = instance.vnode.props

  // 转成 onClick 的格式
  const evenName = toHandlerKey(camelize(event))

  const handler = props[evenName]
  handler && handler(...args)
}
