import React from "react"
import * as rtl from "react-testing-library"
import SubProvider from "../src/SubProvider"
import Provider, { stateContext } from "../src/Provider"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"

describe("SubProvider", () => {
  test("selector reduces state", () => {
    const tester = rtl.render(
      <Provider initialState={{ thing: 1, another: 2 }}>
        <stateContext.Consumer>
          {state => (
            <div>
              <div data-testid="outer">{JSON.stringify(state)}</div>
              <SubProvider selector={state => state.another}>
                <stateContext.Consumer>
                  {state => (
                    <div data-testid="inner">{JSON.stringify(state)}</div>
                  )}
                </stateContext.Consumer>
              </SubProvider>
            </div>
          )}
        </stateContext.Consumer>
      </Provider>
    )
    expect(tester.getByTestId("outer")).toHaveTextContent(
      JSON.stringify({ thing: 1, another: 2 })
    )
    expect(tester.getByTestId("inner")).toHaveTextContent(JSON.stringify(2))
  })
})
