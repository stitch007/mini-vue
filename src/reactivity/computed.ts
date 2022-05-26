import { Dep } from './dep'
import { ReactiveEffect } from './effect'
import { trackRefValue, triggerRefValue } from './ref'
import { isFunction } from '../shared'

export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void

export class ComputedRefImpl<T> {
  private _value!: T
  // 计算属性被访问时的依赖
  public dep?: Dep = undefined
  // 计算属性的effect
  public readonly effect: ReactiveEffect<T>
  public readonly __v_isRef = true
  public _dirty = true

  constructor(getter: ComputedGetter<T>, private setter: ComputedSetter<T>) {
    this.effect = new ReactiveEffect<T>(getter, () => {
      if (!this._dirty) {
        this._dirty = true
        triggerRefValue(this)
      }
    })
  }

  get value() {
    trackRefValue(this)
    if (this._dirty) {
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }

  set value(newValue: T) {
    this.setter(newValue)
  }
}

export function computed<T>(options: ComputedGetter<T> | { get: ComputedGetter<T>, set: ComputedSetter<T> }) {
  if (isFunction(options)) {
    return new ComputedRefImpl(options, () => {})
  } else {
    return new ComputedRefImpl(options.get, options.set)
  }
}

