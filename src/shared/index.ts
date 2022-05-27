export const isObject = (val: unknown) => {
  return val !== null && typeof val === 'object'
}

export const isFunction = (value: unknown): value is Function => typeof value === 'function'

export const isString = (val: unknown) => typeof val === 'string'

export const isArray = Array.isArray

export const extend = Object.assign

export const hasChange = (newValue: unknown, oldValue: unknown) => !Object.is(newValue, oldValue)
