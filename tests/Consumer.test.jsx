import React from "react"
import * as rtl from "react-testing-library"
import Provider from "../src/Provider"
import Consumer, { consumer } from "../src/Consumer"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"

describe("Consumer", () => {
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
        <Consumer
          render={actions => <div>{JSON.stringify(Object.keys(actions))}</div>}
        />
      </Provider>
    )
    expect(
      tester.queryByText(JSON.stringify(["state", "props", "actions"]))
    ).not.toBe(null)
  })
  test("create new consumer with consumer", () => {
    const fancy = React.createContext()
    const fancydispatch = React.createContext()
    const SpecialConsumer = consumer(fancy, fancydispatch)
    const tester = rtl.render(
      <fancy.Provider value={{ hi: "there" }}>
        <fancydispatch.Provider value={{ boo: "boo" }}>
          <SpecialConsumer
            prop={1}
            render={stuff => <div>{JSON.stringify(stuff)}</div>}
          />
        </fancydispatch.Provider>
      </fancy.Provider>
    )
    expect(
      tester.queryByText(
        JSON.stringify({
          state: { hi: "there" },
          props: { prop: 1 },
          actions: { boo: "boo" }
        })
      )
    ).not.toBe(null)
  })
})
