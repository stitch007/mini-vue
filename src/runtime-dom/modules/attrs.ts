export function patchAttr(el, key, value) {
  if (!value) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
