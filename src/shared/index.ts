export const isObject = (val: unknown) => {
  return val !== null && typeof val === 'object'
}

export const isFunction = (value: unknown): value is Function => typeof value === 'function'

export const isString = (val: unknown) => typeof val === 'string'
