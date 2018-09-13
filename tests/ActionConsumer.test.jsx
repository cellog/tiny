import React from "react"
import * as rtl from "react-testing-library"
import Provider from "../src/Provider"
import ActionConsumer, { actionConsumer } from "../src/ActionConsumer"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"

describe("ActionConsumer", () => {
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
        <ActionConsumer
          prop={1}
          render={actions => (
            <div>
              <div>{JSON.stringify(actions.props)}</div>
              <div>{JSON.stringify(Object.keys(actions.actions))}</div>
            </div>
          )}
        />
      </Provider>
    )
    expect(
      tester.queryByText(JSON.stringify(["actions", "generators"]))
    ).not.toBe(null)
    expect(tester.queryByText(JSON.stringify({ prop: 1 }))).not.toBe(null)
  })
  test("create new consumer with actionConsumer", () => {
    const fancy = React.createContext()
    const SpecialActionConsumer = actionConsumer(fancy)
    const tester = rtl.render(
      <fancy.Provider value={{ hi: "there" }}>
        <SpecialActionConsumer
          prop={1}
          render={actions => <div>{JSON.stringify(actions)}</div>}
        />
      </fancy.Provider>
    )
    expect(
      tester.queryByText(
        JSON.stringify({ actions: { hi: "there" }, props: { prop: 1 } })
      )
    ).not.toBe(null)
  })
})
