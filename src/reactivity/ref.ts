import { createDep, Dep } from './dep'
import { isTracking, trackEffects, triggerEffect } from './effect'

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
  ref.dep && triggerEffect(ref.dep)
}
