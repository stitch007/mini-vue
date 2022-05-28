export function patchClass(el, next) {
  if (!next) {
    el.removeAttribute('class')
  } else {
    el.className = next
  }
}
