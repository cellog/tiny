import { createContext } from "react"

export function arrayIndexMapper(index) {
  return 1 << index % 30
}

export function arrayMapper(length) {
  return Array(length)
    .fill(1)
    .map((_, i) => arrayIndexMapper(i))
}

export function objectMapper(indices) {
  return indices.reduce((map, item, i) => {
    if (item.reduce instanceof Function) {
      const struct = map[item[0]] || {}
      let pointer = struct
      for (let idx = 1; idx < item.length; idx++) {
        if (!pointer[item[idx]]) {
          if (idx === item.length - 2 && typeof item[idx + 1] === "number") {
            pointer[item[idx]] = []
          } else {
            pointer[item[idx]] = {}
          }
        }
        if (idx === item.length - 1) {
          pointer[item[idx]] = arrayIndexMapper(i)
        }
        pointer = pointer[item[idx]]
      }
      return {
        ...map,
        [item[0]]: struct
      }
    }
    return {
      ...map,
      [item]: arrayIndexMapper(i)
    }
  }, {})
}

export function objectKeysToArray(object) {
  if (!object) return []
  if (typeof object.reduce === "function") {
    return object.map((_, i) => i)
  }
  return Object.keys(object).reduce((indices, key) => {
    if (
      object[key] !== null &&
      typeof object[key] === "object" &&
      Object.keys(object[key]).length
    ) {
      return [
        ...indices,
        ...objectKeysToArray(object[key]).map(nested => [
          key,
          ...(nested.reduce instanceof Function ? nested : [nested])
        ])
      ]
    }
    return [...indices, key]
  }, [])
}

export function objectKeyValue(map, key, throws = false, i = 0) {
  if (key.reduce instanceof Function) {
    if (i === key.length - 1) {
      if (throws) {
        if (undefined === map[key[i]]) {
          throw new Error(`Invalid key, map value does not exist: ${key[i]}`)
        }
        if (typeof map[key] === "object") {
          throw new Error(`Invalid key, map key is not a leaf: "${key}"`)
        }
      }
      return map[key[i]]
    }
    return objectKeyValue(map[key[i]], key, throws, i + 1)
  }
  if (throws) {
    if (map[key] === undefined) {
      throw new Error(`Invalid key, map value does not exist: "${key}"`)
    }
    if (typeof map[key] === "object") {
      throw new Error(`Invalid key, map key is not a leaf: "${key}"`)
    }
  }
  return map[key]
}

export function arrayKeyValue(map, key, throws = false) {
  if (key > map.length) {
    if (throws) {
      throw new Error(`Array key out of bounds: ${key}`)
    }
    return 0
  }
  return map[key]
}

export const mapObservedBitMapper = map => (prev, next) => {
  return map.reduce((bits, mapper, index) => {
    if (
      map.getValue(prev, mapper, index) !== map.getValue(next, mapper, index)
    ) {
      return bits | map.getBits(mapper, true)
    }
    return bits
  }, 0)
}

export function makeArrayMapper(length) {
  const _map = arrayMapper(length)
  const map = {
    reduce: _map.reduce.bind(_map),
    getValue(array, key, index, throws = false) {
      return arrayKeyValue(array, index, throws)
    },
    getBits(mapper) {
      return _map[mapper]
    },
    context() {
      return _context
    }
  }
  const _context = createContext(null, mapObservedBitMapper(map))
  return map
}

export function makeObjectMapper(legend) {
  const _indices = objectKeysToArray(legend)
  const _map = objectMapper(_indices)
  function getValue(obj, key, index, throws = false) {
    const value = objectKeyValue(obj, key, throws)
    if (typeof value === "number") return value
    if (throws) {
      throw new Error(
        `map did not map to an index, mapped to: ${JSON.stringify(
          value
        )} with index ${_indices[index]}`
      )
    }
    return value
  }
  const map = {
    reduce: _indices.reduce.bind(_indices),
    getValue: getValue,
    getBits(mapper) {
      return getValue(_map, mapper, true)
    },
    context() {
      return _context
    }
  }
  const _context = createContext(null, mapObservedBitMapper(map))
  return map
}
