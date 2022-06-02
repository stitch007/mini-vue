import { shallowReactive } from '../reactivity/reactive'

export function initProps(instance, rawProps) {
  const { props, attrs } = resolveProps(instance.propsOptions, rawProps)

  instance.props = shallowReactive(props)
  instance.attrs = attrs
}

export function updateProps(instance, rawProps, rawPrevProps) {
  const { props, attrs } = instance
  const { props: newProps, attrs: newAttrs } = resolveProps(instance.propsOptions, rawProps)

  updateOptions(props, newProps)
  updateOptions(attrs, newAttrs)
}

function resolveProps(propsOptions, rawProps) {
  const props = {}
  const attrs = {}
  const options = propsOptions && Object.keys(propsOptions)

  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      if (options.includes(key)) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }

  return {
    props,
    attrs
  }
}

function updateOptions(prev, next) {
  for (const key in prev) {
    if (prev[key] !== next[key]) {
      prev[key] = next[key]
    }
  }
  for (const key in prev) {
    if (!(key in next)) {
      delete prev[key]
    }
  }
}
