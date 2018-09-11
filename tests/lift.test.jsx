import React from "react"
import * as rtl from "react-testing-library"
import lift, { liftSetState } from "../src/lift"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"
import Provider, { stateContext, dispatchContext } from "../src/Provider"

describe("lift render props helper", () => {
  test("liftSetState", () => {
    const state = { thing: 1 }
    const mock = {
      setState: jest.fn(),
      props: {
        liftState: jest.fn()
      },
      state
    }
    const liftit = liftSetState(mock, "hi")
    liftit(state)
    expect(mock.setState).toHaveBeenCalled()
    expect(mock.setState.mock.calls[0][0]).toBe(state)
    expect(typeof mock.setState.mock.calls[0][1]).toBe("function")
    mock.setState.mock.calls[0][1]()
    expect(mock.props.liftState).toHaveBeenCalled()
    expect(mock.props.liftState.mock.calls[0][0]).toBe("hi")
    expect(mock.props.liftState.mock.calls[0][1]).toBe(mock.state)
  })
  describe("lift", () => {
    const Lift = lift(
      class Comp extends React.Component {
        constructor(props) {
          super(props)
          this.state = props.initState("hi", { no: "thing" })
        }

        render() {
          return (
            <div>
              <button onClick={() => this.props.liftState("hi", this.state)}>
                liftState
              </button>
              <button onClick={() => this.props.liftActions("hi", { do() {} })}>
                liftActions
              </button>
              <div data-testid="state">{JSON.stringify(this.state)}</div>
              <stateContext.Consumer>
                {state => (
                  <div data-testid="global">{JSON.stringify(state)}</div>
                )}
              </stateContext.Consumer>
              <dispatchContext.Consumer>
                {actions => (
                  <div data-testid="globalactions">
                    {JSON.stringify(Object.keys(actions.actions))}
                  </div>
                )}
              </dispatchContext.Consumer>
            </div>
          )
        }
      }
    )
    test("initState, no provided state yet", () => {
      const tester = rtl.render(
        <Provider initialState={{}}>
          <Lift />
        </Provider>
      )
      expect(tester.getByTestId("state")).toHaveTextContent(
        JSON.stringify({ no: "thing" })
      )
    })
    test("initState, state provided", () => {
      const tester = rtl.render(
        <Provider initialState={{ hi: { yo: "there" } }}>
          <Lift />
        </Provider>
      )
      expect(tester.getByTestId("state")).toHaveTextContent(
        JSON.stringify({ yo: "there" })
      )
    })
    test("liftState", () => {
      const tester = rtl.render(
        <Provider initialState={{}}>
          <Lift />
        </Provider>
      )
      rtl.fireEvent.click(tester.getByText("liftState"))

      expect(tester.getByTestId("global")).toHaveTextContent(
        JSON.stringify({ hi: { no: "thing" } })
      )
    })
    test("liftActions", () => {
      const tester = rtl.render(
        <Provider initialState={{}}>
          <Lift />
        </Provider>
      )
      rtl.fireEvent.click(tester.getByText("liftActions"))

      expect(tester.getByTestId("globalactions")).toHaveTextContent(
        JSON.stringify(["liftState", "liftActions", "hi"])
      )
    })
    test("integration: liftSetState in lift", () => {
      const Integrated = lift(
        class Comp extends React.Component {
          constructor(props) {
            super(props)
            this.state = props.initState("hi", { no: "thing" })
            this.liftedSetState = liftSetState(this, "hi")
          }

          render() {
            return (
              <div>
                <button onClick={() => this.liftedSetState({ no: "other" })}>
                  liftedSetState
                </button>
                <button
                  onClick={() => this.props.liftActions("hi", { do() {} })}
                >
                  liftActions
                </button>
                <div data-testid="state">{JSON.stringify(this.state)}</div>
                <stateContext.Consumer>
                  {state => (
                    <div data-testid="global">{JSON.stringify(state)}</div>
                  )}
                </stateContext.Consumer>
                <dispatchContext.Consumer>
                  {actions => (
                    <div data-testid="globalactions">
                      {JSON.stringify(Object.keys(actions.actions))}
                    </div>
                  )}
                </dispatchContext.Consumer>
              </div>
            )
          }
        }
      )
      const tester = rtl.render(
        <Provider initialState={{}}>
          <Integrated />
        </Provider>
      )
      rtl.fireEvent.click(tester.getByText("liftedSetState"))
      expect(tester.getByTestId("state")).toHaveTextContent(
        JSON.stringify({ no: "other" })
      )
      expect(tester.getByTestId("global")).toHaveTextContent(
        JSON.stringify({ hi: { no: "other" } })
      )
    })
  })
})
