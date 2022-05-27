import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers'
import { isObject } from '../shared'

export const reactiveMap = new WeakMap<object, any>()
export const readonlyMap = new WeakMap<object, any>()
export const shallowReadonlyMap = new WeakMap<object, any>()

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  IS_RAW = '__v_raw',
}

export function reactive(target: object) {
  return createReactiveObject(target, reactiveMap, mutableHandlers)
}

export function readonly(target: object) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers)
}

export function shallowReadonly(target: object) {
  return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers)
}

export function isReactive(value: object) {
  // 当访问不到的时候，会返回 undefined，需要转换成布尔值
  return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: object) {
  // 当访问不到的时候，会返回 undefined，需要转换成布尔值
  return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}

export const toReactive = (value) => isObject(value) ? reactive(value) : value

export const toReadonly = (value) => isObject(value) ? readonly(value) : value

export function toRaw(value) {
  if (!isObject(value)) {
    return value
  }
  // 不是proxy一定是普通对象
  if (!value[ReactiveFlags.IS_RAW]) {
    return value
  }
  return value[ReactiveFlags.IS_RAW]
}

function createReactiveObject(target: object, proxyMap: WeakMap<object, any>, baseHandlers: ProxyHandler<any>) {
  // 已经存在的不重复创建
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, baseHandlers)
  // 创建完proxy就放到相应的map中
  proxyMap.set(target, proxy)

  return proxy
}
