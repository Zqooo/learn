export const isObject = (value) => {
  return typeof value === 'object' && value !== null
}

export const isFunction = (value) => {
  return typeof value === 'function'
}

export const isString = (value) => {
  return typeof value === 'string'
}

export const isArray = (value) => {
  return Array.isArray(value)
}

export const isNumber = (value) => {
  return typeof value === 'number'
}