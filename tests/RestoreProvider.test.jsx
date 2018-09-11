import React from "react"
import * as rtl from "react-testing-library"
import Provider, { stateContext, bothContext } from "../src/Provider"
import SubProvider from "../src/SubProvider"
import RestoreProvider from "../src/RestoreProvider"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"

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
          <bothContext.Consumer>
            {({ state, actions }) => (
              <div>
                <button onClick={actions.actions.plusThing}>plusThing</button>
                <div data-testid="substate1">{JSON.stringify(state)}</div>
              </div>
            )}
          </bothContext.Consumer>
          <stateContext.Consumer>
            {state => (
              <div>
                <div data-testid="substate2">{JSON.stringify(state)}</div>
              </div>
            )}
          </stateContext.Consumer>
          <RestoreProvider>
            <bothContext.Consumer>
              {({ state, actions }) => (
                <div>
                  <button onClick={actions.actions.minusAnother}>
                    minusAnother
                  </button>
                  <div data-testid="restorestate1">
                    {JSON.stringify(state) +
                      JSON.stringify(Object.keys(actions.actions)) +
                      JSON.stringify(Object.keys(actions.generators))}
                  </div>
                </div>
              )}
            </bothContext.Consumer>
            <stateContext.Consumer>
              {state => (
                <div>
                  <div data-testid="restorestate2">{JSON.stringify(state)}</div>
                </div>
              )}
            </stateContext.Consumer>
          </RestoreProvider>
        </SubProvider>
      </ContextTester>
    )
    expect(tester.getByTestId("substate1")).toHaveTextContent(JSON.stringify(1))
    expect(tester.getByTestId("substate2")).toHaveTextContent(JSON.stringify(1))
    expect(tester.getByTestId("restorestate1")).toHaveTextContent(
      JSON.stringify({ thing: 1, another: 4 }) +
        JSON.stringify([
          "liftState",
          "liftActions",
          "plusThing",
          "minusAnother"
        ]) +
        JSON.stringify(["one"])
    )
    expect(tester.getByTestId("restorestate2")).toHaveTextContent(
      JSON.stringify({ thing: 1, another: 4 })
    )

    rtl.fireEvent.click(tester.getByText("plusThing"))

    await rtl.waitForElement(() => tester.getByText("2"))
    expect(tester.getByTestId("substate1")).toHaveTextContent(JSON.stringify(2))
    expect(tester.getByTestId("substate2")).toHaveTextContent(JSON.stringify(2))
    expect(tester.getByTestId("restorestate1")).toHaveTextContent(
      JSON.stringify({ thing: 2, another: 4 }) +
        JSON.stringify([
          "liftState",
          "liftActions",
          "plusThing",
          "minusAnother"
        ]) +
        JSON.stringify(["one"])
    )
    expect(tester.getByTestId("restorestate2")).toHaveTextContent(
      JSON.stringify({ thing: 2, another: 4 })
    )

    rtl.fireEvent.click(tester.getByText("minusAnother"))

    await rtl.waitForElement(() =>
      tester.getByText(JSON.stringify({ thing: 2, another: 3 }))
    )
    expect(tester.getByTestId("substate1")).toHaveTextContent(JSON.stringify(2))
    expect(tester.getByTestId("substate2")).toHaveTextContent(JSON.stringify(2))
    expect(tester.getByTestId("restorestate1")).toHaveTextContent(
      JSON.stringify({ thing: 2, another: 3 }) +
        JSON.stringify([
          "liftState",
          "liftActions",
          "plusThing",
          "minusAnother"
        ]) +
        JSON.stringify(["one"])
    )
    expect(tester.getByTestId("restorestate2")).toHaveTextContent(
      JSON.stringify({ thing: 2, another: 3 })
    )
  })
})
