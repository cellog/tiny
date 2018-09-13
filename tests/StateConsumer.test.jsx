import React from "react"
import * as rtl from "react-testing-library"
import Provider from "../src/Provider"
import StateConsumer, { stateConsumer } from "../src/StateConsumer"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"

describe("StateConsumer", () => {
  test("default", () => {
    const tester = rtl.render(
      <Provider
        initialState={{ thing: 1 }}
        actions={{
          set(state) {
            return { thing: state.thing + 1 }
          }
        }}
      >
        <StateConsumer
          render={state => <div>{JSON.stringify(state)}</div>}
          prop={1}
        />
      </Provider>
    )
    expect(
      tester.queryByText(
        JSON.stringify({ state: { thing: 1 }, props: { prop: 1 } })
      )
    ).not.toBe(null)
  })
  test("create new consumer with actionConsumer", () => {
    const fancy = React.createContext()
    const SpecialStateConsumer = stateConsumer(fancy)
    const tester = rtl.render(
      <fancy.Provider value={{ hi: "there" }}>
        <SpecialStateConsumer
          prop={1}
          render={state => <div>{JSON.stringify(state)}</div>}
        />
      </fancy.Provider>
    )
    expect(
      tester.queryByText(
        JSON.stringify({ state: { hi: "there" }, props: { prop: 1 } })
      )
    ).not.toBe(null)
  })
})
