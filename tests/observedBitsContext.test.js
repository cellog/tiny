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
  test("objectKeysToArray with sub-array", () => {
    expect(bits.objectKeysToArray({ hi: 1, there: Array(3).fill(1) })).toEqual([
      "hi",
      ["there", 0],
      ["there", 1],
      ["there", 2]
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
  test("objectMapper with sub-array", () => {
    expect(
      bits.objectMapper(
        bits.objectKeysToArray({
          hi: { you: { sexy: { thing: Array(5).fill(1) } } },
          how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
        })
      )
    ).toEqual({
      hi: { you: { sexy: { thing: [1, 2, 4, 8, 16] } } },
      how: { are: { you: { doing: { there: 32, good: 64 }, wow: 128 } } }
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
    expect(() => bits.arrayKeyValue(bits.arrayMapper(5), 8, true)).toThrow(
      "Array key out of bounds: 8"
    )
  })
  describe("makeArrayMapper", () => {
    const mapper = bits.makeArrayMapper(40)
    test("reduce", () => {
      expect(
        mapper.reduce((bits, index) => {
          bits.push(index)
          return bits
        }, [])
      ).toHaveLength(40)
    })
    test("getValue", () => {
      expect(mapper.getValue(["whatever", 2, 4], 1, 2)).toBe(4)
      expect(() => mapper.getValue(["whatever", 2, 4], 1, 200, true)).toThrow()
    })
    test("getBits", () => {
      expect(mapper.getBits(2)).toBe(4)
    })
  })
  describe("makeObjectMapper", () => {
    const mapper = bits.makeObjectMapper({
      hi: { you: { sexy: { thing: Array(5).fill(1) } } },
      how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
    })
    test("reduce", () => {
      expect(
        mapper.reduce((bits, index) => {
          bits.push(index)
          return bits
        }, [])
      ).toHaveLength(8)
    })
    test("getValue", () => {
      const state = {
        hi: {
          you: {
            sexy: {
              thing: Array(5)
                .fill(1)
                .map((_, i) => i)
            }
          }
        },
        how: {
          are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } }
        }
      }
      expect(mapper.getValue(state, ["hi", "you", "sexy", "thing", 1])).toBe(1)
      expect(mapper.getValue(state, ["hi", "you", "sexy", "thing", 0])).toBe(0)
      expect(
        mapper.getValue(state, ["how", "are", "you", "doing", "there"])
      ).toBe(2)
    })
    test("getBits", () => {
      expect(mapper.getBits(["hi", "you", "sexy", "thing", 1])).toBe(2)
      expect(mapper.getBits(["hi", "you", "sexy", "thing", 0])).toBe(1)
      expect(mapper.getBits(["how", "are", "you", "doing", "there"])).toBe(32)
    })
  })
  test("context", () => {
    const mapper = bits.makeArrayMapper(40)
    const FancyContext = mapper.context()
    const updates = []

    class Li extends React.Component {
      shouldComponentUpdate() {
        return false
      }

      render() {
        const { i } = this.props
        return (
          <FancyContext.Consumer unstable_observedBits={mapper.getBits(i)}>
            {state => {
              updates.push(i)
              return <li>{state[i]}</li>
            }}
          </FancyContext.Consumer>
        )
      }
    }
    class Updates extends React.Component {
      constructor(props) {
        super(props)
        this.state = {
          info: Array(40)
            .fill(1)
            .map((_, i) => i + 1)
        }
        this.mapper = (thing, i) => <Li i={i} key={i} />
      }

      render() {
        return (
          <FancyContext.Provider value={this.state.info}>
            <ul>{this.state.info.map(this.mapper)}</ul>
            <button
              onClick={() =>
                this.setState(state => {
                  const info = [...state.info]
                  info[3] = "hji"
                  info[27] = "wow"
                  return { info }
                })
              }
            >
              set
            </button>
          </FancyContext.Provider>
        )
      }
    }

    const tester = rtl.render(<Updates />)
    expect(updates.length).toBe(40)
    rtl.fireEvent.click(tester.getByText("set"))
    expect(updates.length).toBe(43)
  })
  test.skip("mapObservedBitMapper", () => {
    const map = bits.objectMapper(
      bits.objectKeysToArray({
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      })
    )
  })
})
