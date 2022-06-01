import { reactive, ReactiveFlags, readonly } from './reactive'
import { track, trigger } from './effect'
import { isObject } from '../shared'

const get = createGetter()
const set = createSetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true, false)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string, receiver: object) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 用于判断对象是不是Reactive
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      // 用于判断对象是不是Readonly
      return isReadonly
    } else if (key === ReactiveFlags.IS_RAW) {
      // 如果是Raw，直接返回不需要套proxy
      return target
    }

    const result = Reflect.get(target, key, receiver)

    // readonly不可以被set不需要收集依赖
    if (!isReadonly) {
      track(target, key)
    }

    if (shallow) {
      return result
    }

    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result)
    }

    return result
  }
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver)

    trigger(target, key)

    return res
  }
}

export const mutableHandlers = { get, set }

export const shallowReactiveHandlers = { get: shallowGet, set }

export const readonlyHandlers = {
  get: readonlyGet,
  set(target: object, key: string) {
    console.warn(`Set operation on key "${key}" failed: target is readonly.`, target)
    return true
  }
}

export const shallowReadonlyHandlers = {
  get: shallowReadonlyGet,
  set(target: object, key: string) {
    console.warn(`Set operation on key "${key}" failed: target is readonly.`, target)
    return true
  },
}
