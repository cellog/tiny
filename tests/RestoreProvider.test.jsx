import React from "react"
import * as rtl from "react-testing-library"
import Provider, { stateContext, dispatchContext } from "../src/Provider"
import SubProvider from "../src/SubProvider"
import RestoreProvider from "../src/RestoreProvider"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"

describe("RestoreProvider", () => {
  test("restoreContext from parent", async () => {
    const ContextTester = ({ children, actions }) => (
      <Provider
        initialState={{ thing: 1, another: 4 }}
        actions={actions}
        asyncActionGenerators={{ one: { make() {}, init() {}, start() {} } }}
      >
        {children}
      </Provider>
    )
    const tester = rtl.render(
      <ContextTester
        initial={"wow"}
        actions={{
          plusThing(state) {
            return { thing: state.thing + 1 }
          },
          minusAnother(state) {
            return { another: state.another - 1 }
          }
        }}
      >
        <SubProvider selector={state => state.thing}>
          <dispatchContext.Consumer>
            {({ state, actions }) => (
              <div>
                <button onClick={actions.plusThing}>plusThing</button>
                <button onClick={actions.minusAnother}>minusAnother</button>
              </div>
            )}
          </dispatchContext.Consumer>
          <stateContext.Consumer>
            {state => (
              <div>
                <div data-testid="substate">{JSON.stringify(state)}</div>
              </div>
            )}
          </stateContext.Consumer>
          <RestoreProvider>
            <stateContext.Consumer>
              {state => (
                <div>
                  <div data-testid="restorestate">{JSON.stringify(state)}</div>
                </div>
              )}
            </stateContext.Consumer>
          </RestoreProvider>
        </SubProvider>
      </ContextTester>
    )
    expect(tester.getByTestId("substate")).toHaveTextContent(JSON.stringify(1))
    expect(tester.getByTestId("restorestate")).toHaveTextContent(
      JSON.stringify({ thing: 1, another: 4 })
    )

    rtl.fireEvent.click(tester.getByText("plusThing"))

    await rtl.waitForElement(() => tester.getByText("2"))
    expect(tester.getByTestId("substate")).toHaveTextContent(JSON.stringify(2))
    expect(tester.getByTestId("restorestate")).toHaveTextContent(
      JSON.stringify({ thing: 2, another: 4 })
    )

    rtl.fireEvent.click(tester.getByText("minusAnother"))

    await rtl.waitForElement(() =>
      tester.getByText(JSON.stringify({ thing: 2, another: 3 }))
    )
    expect(tester.getByTestId("substate")).toHaveTextContent(JSON.stringify(2))
    expect(tester.getByTestId("restorestate")).toHaveTextContent(
      JSON.stringify({ thing: 2, another: 3 })
    )
  })
})
