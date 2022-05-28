import { isOn } from "../shared";
import { patchClass } from './modules/class'
import { patchStyle } from './modules/style'
import { patchEvent } from './modules/event'

// DOM属性操作
export function patchProp(el, key, prev, next) {
  if (key === 'class') {
    patchClass(el, next)
  } else if (key === 'style') {
    patchStyle(el, prev, next)
  } else if (isOn(key)) {
    patchClass(el, next)
  } else {
    patchEvent(el, key, next)
  }
}
