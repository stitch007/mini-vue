export function patchStyle(el, prev, next) {
  for (const key in next) {
    el.style[key] = next[key]
  }
  if (prev) {
    for (const key in prev) {
      if (!next[key]) {
        el.style[key] = null
      }
    }
  }
}
