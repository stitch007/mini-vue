import { createDep, Dep } from './dep'
import { isTracking, trackEffects, triggerEffect } from './effect'
import { isReactive, toRaw, toReactive } from './reactive'
import { hasChange, isArray } from '../shared'

export interface Ref<T = any> {
  value: T
}

type RefBase<T> = {
  dep?: Dep
  value: T
}

export function trackRefValue(ref: RefBase<any>) {
  if (isTracking()) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}

export function triggerRefValue(ref: RefBase<any>) {
  triggerEffect(new Set(ref.dep || []))
}

class RefImpl<T> {
  private _value: T
  private _rawValue: T

  // 被effect访问时的依赖
  public dep?: Dep = undefined
  public readonly __v_isRef = true

  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rawValue = this.__v_isShallow ? value : toRaw(value)
    // 如果是shallow就返回原值，如果是深度的且是对象就用reactive包裹一下
    this._value = this.__v_isShallow ? value : toReactive(value)
  }

  get value() {
    // 被effect依赖的时候收集它
    trackRefValue(this)
    return this._value
  }

  set value(newValue) {
    if (hasChange(newValue, this._rawValue)) {
      this._rawValue = newValue
      this._value = this.__v_isShallow ? newValue : toReactive(newValue)
      // 值变了触发所有effect
      triggerRefValue(this)
    }
  }
}

class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly __v_isRef = true

  constructor(private readonly _object: T, private readonly _key) {}

  get value() {
    return this._object[this._key]
  }

  set value(newVal) {
    this._object[this._key] = newVal
  }
}

export function ref<T>(value: T) {
  return createRef(value)
}

export function shallowRef<T>(value: T) {
  return createRef(value, true)
}

function createRef(value, shallow = false) {
  return new RefImpl(value, shallow)
}

export function isRef(value: any): value is Ref {
  return !!(value && value.__v_isRef === true)
}

export function unref<T>(value: T | Ref<T>): T {
  return isRef(value) ? value.value : value
}

export function toRef<T extends object, K extends keyof T>(object: T, key: K) {
  return new ObjectRefImpl(object, key)
}

// const data = reactive({ a: 1, b: 2 })
// const { a, b } = toRefs(data)
// 需要使用toRefs转换结构出来的a，b才能保持响应式
export function toRefs<T extends object>(object: T) {
  const result: any = isArray(object) ? new Array(object.length) : {}
  for (const key in object) {
    result[key] = toRef(object, key)
  }
  return result
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key]
    // 原始值不是ref直接set，新值是ref直接set
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value
      return true
    } else {
      return Reflect.set(target, key, value, receiver)
    }
  }
}

// 这个函数的目的是帮助解构 ref, 套上这个函数在模板中使用的时候就不需要.value了
export function proxyRefs<T extends object>(object: T) {
  return isReactive(object) ? object : new Proxy(object, shallowUnwrapHandlers)
}
