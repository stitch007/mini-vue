export * from './shapeFlags'

export const isObject = (val: unknown) => {
  return val !== null && typeof val === 'object'
}

export const isFunction = (value: unknown): value is Function => typeof value === 'function'

export const isString = (val: unknown) => typeof val === 'string'

export const isArray = Array.isArray

export const extend = Object.assign

export const hasChange = (newValue: unknown, oldValue: unknown) => !Object.is(newValue, oldValue)

const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)

export function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key)
}

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as any
}

const camelizeRE = /-(\w)/g

/**
 * 将横线命名变为驼峰命名
 * on-change -> onChange
 */
export const camelize = cacheStringFunction((str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})

/**
 * 首字母大写
 * change -> Change
 */
export const capitalize = cacheStringFunction(
  (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
)

/**
 * 前缀 + on
 * change -> onChange
 */
export const toHandlerKey = cacheStringFunction((str: string) =>
  str ? `on${capitalize(str)}` : ``
)

export const invokeArrayFns = (fns: Function[], arg?: any) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg)
  }
}
