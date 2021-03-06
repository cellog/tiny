import React from "react"
import * as rtl from "react-testing-library"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"

import * as bits from "../src/observedBitsContext"

describe("creating and consuming contexts using observedBits", () => {
  test("arrayIndexMapper starts at 1, wraps every 29 indices", () => {
    expect(bits.arrayIndexMapper(0)).toBe(1)
    expect(bits.arrayIndexMapper(1)).toBe(2)
    expect(bits.arrayIndexMapper(29)).toBe(1 << 29)
    expect(bits.arrayIndexMapper(30)).toBe(1)
    expect(bits.arrayIndexMapper(59)).toBe(1 << 29)
    expect(bits.arrayIndexMapper(60)).toBe(1)
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
  test("objectKeysToArray with variable-length sub-array", () => {
    expect(bits.objectKeysToArray({ hi: 1, there: [] })).toEqual([
      "hi",
      ["there", []]
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
  test("objectMapper with variable-length sub-array", () => {
    const map = bits.objectMapper(
      bits.objectKeysToArray({
        nested: { array: [] }
      })
    )

    expect(map).toEqual({
      nested: { array: [] }
    })
  })
  describe("objectKeyValue", () => {
    let map
    beforeEach(() =>
      (map = bits.objectMapper(
        bits.objectKeysToArray({
          hi: { you: { sexy: { thing: "yowza" } } },
          how: {
            are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } }
          },
          nested: { array: [] }
        })
      )))
    test("errors", () => {
      expect(bits.objectKeyValue({}, "oops")).toBe(undefined)
      expect(() => bits.objectKeyValue({}, "oops", true)).toThrow(
        'Invalid key, map value does not exist: "oops"'
      )
    })
    test("basic", () => {
      expect(bits.objectKeyValue(map, ["hi", "you", "sexy", "thing"])).toBe(1)
      expect(
        bits.objectKeyValue(map, ["how", "are", "you", "doing", "there"])
      ).toBe(2)
      expect(
        bits.objectKeyValue(map, ["how", "are", "you", "doing", "good"])
      ).toBe(4)
      expect(bits.objectKeyValue(map, ["how", "are", "you", "wow"])).toBe(8)
    })
    test("undefined index", () => {
      expect(bits.objectKeyValue(map, ["hi", "you", "sexy", "oops"])).toBe(
        undefined
      )
      expect(() =>
        bits.objectKeyValue(map, ["hi", "you", "sexy", "oops"], true)
      ).toThrow('Invalid key, map value does not exist: "oops"')
    })
    test("key value for sub-tree", () => {
      expect(bits.objectKeyValue(map, "hi")).toEqual({
        you: { sexy: { thing: 1 } }
      })
      expect(() => bits.objectKeyValue(map, "hi", true)).toThrow(
        'Invalid key, map key is not a leaf: "hi"'
      )
    })
    test("indeterminate array length value, whole array", () => {
      expect(bits.objectKeyValue(map, ["nested", "array"])).toBe(0xefff)
    })
    test("indeterminate array length value, specific index", () => {
      expect(bits.objectKeyValue(map, ["nested", "array", 0])).toBe(1)
      expect(bits.objectKeyValue(map, ["nested", "array", 1])).toBe(2)
      expect(bits.objectKeyValue(map, ["nested", "array", 29])).toBe(0x20000000)
      expect(bits.objectKeyValue(map, ["nested", "array", 30])).toBe(1)
    })
  })
  test("arrayKeyValue", () => {
    const t = new Array(5).fill(1).map((_, i) => i)
    expect(bits.arrayKeyValue(t, 2)).toBe(2)
    expect(bits.arrayKeyValue(t, 8)).toBe(0)
  })
  describe("makeArrayMapper", () => {
    const mapper = bits.makeArrayMapper()
    test("reduce", () => {
      expect(
        mapper.getReducer(new Array(40).fill(1), []).reduce((bits, index) => {
          bits.push(index)
          return bits
        }, [])
      ).toHaveLength(40)
    })
    test("getValue", () => {
      expect(mapper.getValue(["whatever", 2, 4], 2)).toBe(4)
      expect(() => mapper.getValue(["whatever", 2, 4], 200, true)).toThrow()
    })
    test("getBits", () => {
      expect(mapper.getBits(2)).toBe(4)
    })
  })
  describe("makeObjectMapper", () => {
    let mapper
    beforeEach(() =>
      (mapper = bits.makeObjectMapper({
        hi: { you: { sexy: { thing: Array(5).fill(1) } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      })))
    test("reduce", () => {
      expect(
        mapper.getReducer().reduce((bits, index) => {
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
      expect(mapper.getValue(state, 1)).toBe(1)
      expect(mapper.getValue(state, 0)).toBe(0)
      expect(mapper.getValue(state, 2)).toBe(2)
    })
    test("getValue 2", () => {
      const map = bits.makeObjectMapper({
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      })

      const prev = {
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      }
      const next = {
        hi: { you: { sexy: { thing: "baby" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      }

      expect(map.getValue(prev, ["hi", "you", "sexy", "thing"])).toBe("yowza")
      expect(map.getValue(next, ["hi", "you", "sexy", "thing"])).toBe("baby")
    })
    test("getBits", () => {
      expect(mapper.getBits(["hi", "you", "sexy", "thing", 1])).toBe(2)
      expect(mapper.getBits(["hi", "you", "sexy", "thing", 0])).toBe(1)
      expect(mapper.getBits(["how", "are", "you", "doing", "there"])).toBe(32)
    })
  })
  test("context", () => {
    const mapper = bits.makeArrayMapper()
    const FancyContext = mapper.context()
    const updates = []

    class Li extends React.PureComponent {
      render() {
        const { i } = this.props
        return (
          <FancyContext.Consumer unstable_observedBits={mapper.getBits(i)}>
            {state => {
              updates.push([i, mapper.getBits(i)])
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
    expect(updates[40]).toEqual([3, 1 << 3])
    expect(updates[41]).toEqual([27, 1 << 27])
    expect(updates[42]).toEqual([33, 1 << 3])
  })
  describe("mapObservedBitMapper", () => {
    test("object", () => {
      const map = bits.makeObjectMapper({
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      })

      const mapper = bits.mapObservedBitMapper(map)

      const prev = {
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      }
      const next = {
        hi: { you: { sexy: { thing: "yowza" } } },
        how: { are: { you: { doing: { there: 2, good: "friend" }, wow: 1 } } }
      }

      expect(mapper(prev, next)).toBe(0)

      next.hi.you.sexy.thing = "baby"
      expect(mapper(prev, next)).toBe(1)
      next.how.are.you.wow = "baby"
      expect(mapper(prev, next)).toBe(9)
    })
    test("array", () => {
      const map = bits.makeArrayMapper()
      const mapper = bits.mapObservedBitMapper(map)

      const prev = [1, 2, 3, 4]
      const next = [1, 2, 3]

      expect(mapper(prev, next)).toBe(8)
      expect(mapper(next, prev)).toBe(8)

      next.push(4)
      expect(mapper(prev, next)).toBe(0)
      next.push(5)
      expect(mapper(prev, next)).toBe(16)
    })
  })
})
