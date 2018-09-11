import React from "react"
import * as rtl from "react-testing-library"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"

import makeMapperContext, * as bits from "../src/observedBitsContext"

describe("creating and consuming contexts using observedBits", () => {
  test("arrayIndexMapper starts at 1, wraps every 29 indices", () => {
    expect(bits.arrayIndexMapper(0)).toBe(1)
    expect(bits.arrayIndexMapper(1)).toBe(2)
    expect(bits.arrayIndexMapper(29)).toBe(1 << 29)
    expect(bits.arrayIndexMapper(30)).toBe(1)
    expect(bits.arrayIndexMapper(59)).toBe(1 << 29)
    expect(bits.arrayIndexMapper(60)).toBe(1)
  })
  test("arrayMapper", () => {
    expect(bits.arrayMapper(1)).toEqual([1])
    expect(bits.arrayMapper(2)).toEqual([1, 1 << 1])
    expect(bits.arrayMapper(5)).toEqual([1, 1 << 1, 1 << 2, 1 << 3, 1 << 4])
  })
  test("objectKeysToArray", () => {
    expect(bits.objectKeysToArray(null)).toEqual([])
    expect(bits.objectKeysToArray({ hi: 1 })).toEqual(["hi"])
    expect(bits.objectKeysToArray({ hi: 1, there: 2 })).toEqual(["hi", "there"])
    expect(
      bits.objectKeysToArray({
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      })
    ).toEqual([
      ["hi", "you", "sexy", "thing"],
      ["how", "are", "you", "doing", "there"],
      ["how", "are", "you", "doing", "good"],
      ["how", "are", "you", "wow"]
    ])
  })
  test("objectMapper", () => {
    expect(bits.objectMapper(bits.objectKeysToArray(null))).toEqual({})
    expect(bits.objectMapper(bits.objectKeysToArray({ hi: 1 }))).toEqual({
      hi: 1
    })
    expect(
      bits.objectMapper(bits.objectKeysToArray({ hi: 1, there: 2 }))
    ).toEqual({ hi: 1, there: 2 })
    expect(
      bits.objectMapper(
        bits.objectKeysToArray({
          hi: { you: { sexy: { thing: "yowza" } } },
          how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
        })
      )
    ).toEqual({
      hi: { you: { sexy: { thing: 1 } } },
      how: { are: { you: { doing: { there: 2, good: 4 }, wow: 8 } } }
    })
  })
  test("objectKeyValue", () => {
    expect(bits.objectKeyValue({}, "oops")).toBe(undefined)
    expect(() => bits.objectKeyValue({}, "oops", true)).toThrow(
      'Invalid key, map value does not exist: "oops"'
    )
    const map = bits.objectMapper(
      bits.objectKeysToArray({
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      })
    )
    expect(bits.objectKeyValue(map, ["hi", "you", "sexy", "thing"])).toBe(1)
    expect(
      bits.objectKeyValue(map, ["how", "are", "you", "doing", "there"])
    ).toBe(2)
    expect(
      bits.objectKeyValue(map, ["how", "are", "you", "doing", "good"])
    ).toBe(4)
    expect(bits.objectKeyValue(map, ["how", "are", "you", "wow"])).toBe(8)
    expect(bits.objectKeyValue(map, ["hi", "you", "sexy", "oops"])).toBe(
      undefined
    )
    expect(bits.objectKeyValue(map, "hi")).toEqual({
      you: { sexy: { thing: 1 } }
    })
    expect(() => bits.objectKeyValue(map, "hi", true)).toThrow(
      'Invalid key, map key is not a leaf: "hi"'
    )
  })
  test("arrayKeyValue", () => {
    expect(bits.arrayKeyValue(bits.arrayMapper(5), 2)).toBe(4)
    expect(bits.arrayKeyValue(bits.arrayMapper(5), 8)).toBe(0)
    expect(() => bits.arrayKeyValue(bits.arrayMapper(5), 8, throws)).toThrow(
      "Array key out of bounds: 8"
    )
  })
})
