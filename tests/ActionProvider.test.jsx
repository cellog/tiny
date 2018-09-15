import React from "react"
import * as rtl from "react-testing-library"
import { stateContext, dispatchContext } from "../src/Provider"
import ActionProvider from "../src/ActionProvider"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"
import "./setup"
import Provider from "../src/Provider"

describe("ActionProvider", () => {
  test("accepts actions and binds them", () => {
    const action = jest.fn()
    const monitor = jest.fn()
    const monitorGenerator = (...args) => () => monitor(...args)
    const setState = jest.fn((callback, monitor) => {
      callback(1)
      monitor()
    })
    const Base = () => (
      <div>
        <ActionProvider
          actions={{ action }}
          setState={setState}
          monitor={monitorGenerator}
        >
          <dispatchContext.Consumer>
            {({ actions }) => (
              <div>
                <button onClick={() => actions.action("hi")}>click</button>
                <div data-testid="actions">
                  {JSON.stringify(Object.keys(actions))}
                </div>
              </div>
            )}
          </dispatchContext.Consumer>
        </ActionProvider>
      </div>
    )
    const tester = rtl.render(<Base />)

    expect(tester.getByTestId("actions")).toHaveTextContent(
      JSON.stringify(["liftState", "liftActions", "action"])
    )
    rtl.fireEvent.click(tester.getByText("click"))

    expect(action).toHaveBeenCalledWith(1, "hi")
    expect(monitor).toHaveBeenCalledWith("action", action)
  })
  test("accepts async action generators and binds them", () => {
    const action = {
      make: jest.fn(() => 1),
      init: jest.fn(() => 2),
      start: jest.fn(() => 3)
    }
    const monitor = jest.fn()
    const monitorGenerator = (...args) => () => monitor(...args)
    const setState = jest.fn((callback, monitor) => {
      callback(1)
      monitor()
    })
    const Base = () => (
      <div>
        <ActionProvider
          asyncActionGenerators={{ action }}
          actions={{}}
          setState={setState}
          monitor={monitorGenerator}
        >
          <dispatchContext.Consumer>
            {({ generators }) => (
              <div>
                <button onClick={() => generators.action("hi")}>click</button>
                <div data-testid="actions">
                  {JSON.stringify(Object.keys(generators))}
                </div>
              </div>
            )}
          </dispatchContext.Consumer>
        </ActionProvider>
      </div>
    )
    const tester = rtl.render(<Base />)

    expect(tester.getByTestId("actions")).toHaveTextContent(
      JSON.stringify(["action"])
    )
    rtl.fireEvent.click(tester.getByText("click"))

    expect(action.make).toHaveBeenCalledWith("hi")
    expect(action.init.mock.calls[0][0]).toBe(1)
    expect(Object.keys(action.init.mock.calls[0][1])).toEqual([
      "actions",
      "generators"
    ])
    expect(action.init.mock.calls[0][2]).toBe("hi")
    expect(action.start.mock.calls[0][0]).toBe(1)
    expect(action.start.mock.calls[0][1]).toBe(2)
    expect(Object.keys(action.start.mock.calls[0][2])).toEqual([
      "actions",
      "generators"
    ])
    expect(action.start.mock.calls[0][3]).toBe("hi")
  })
  test("thrown errors in actions throw in render", () => {
    const action = () => {
      throw new Error("oops")
    }
    const monitor = jest.fn()
    const monitorGenerator = (...args) => () => monitor(...args)
    const setState = jest.fn((callback, monitor) => {
      callback(1)
      monitor()
    })
    class Catch extends React.Component {
      state = { no: 1 }
      componentDidCatch(e) {
        expect(e.message).toBe("oops")
        this.setState({ yes: 1 })
      }

      render() {
        if (this.state.yes) return <div>got it!</div>
        return this.props.children
      }
    }

    const Base = () => (
      <Catch>
        <ActionProvider
          actions={{ action }}
          setState={setState}
          monitor={monitorGenerator}
        >
          <dispatchContext.Consumer>
            {({ actions }) => (
              <div>
                <button onClick={() => actions.action("hi")}>click</button>
                <div data-testid="actions">
                  {JSON.stringify(Object.keys(actions))}
                </div>
              </div>
            )}
          </dispatchContext.Consumer>
        </ActionProvider>
      </Catch>
    )
    const tester = rtl.render(<Base />)

    // Record all errors.
    let topLevelErrors = []
    function handleTopLevelError(event) {
      topLevelErrors.push(event.error.message)
      // Prevent logging
      event.preventDefault()
    }

    const div = document.createElement("div")
    window.addEventListener("error", handleTopLevelError)
    try {
      rtl.fireEvent.click(tester.getByText("click"))
    } finally {
      window.removeEventListener("error", handleTopLevelError)
    }
    expect(tester.queryByText("got it!")).not.toBe(null)
  })
  test("thrown errors in async generators throw in render", () => {
    class Catch extends React.Component {
      state = { no: 1 }
      componentDidCatch(e) {
        expect(e.message).toBe("oops")
        this.setState({ yes: 1 })
      }

      render() {
        if (this.state.yes) return <div>got it!</div>
        return this.props.children
      }
    }
    const action = {
      make: () => {
        throw new Error("oops")
      },
      init: jest.fn(() => 2),
      start: jest.fn(() => 3)
    }
    const monitor = jest.fn()
    const monitorGenerator = (...args) => () => monitor(...args)
    const setState = jest.fn((callback, monitor) => {
      callback(1)
      monitor()
    })
    const Base = () => (
      <Catch>
        <ActionProvider
          asyncActionGenerators={{ action }}
          actions={{}}
          setState={setState}
          monitor={monitorGenerator}
        >
          <dispatchContext.Consumer>
            {({ generators }) => (
              <div>
                <button onClick={() => generators.action("hi")}>click</button>
                <div data-testid="actions">
                  {JSON.stringify(Object.keys(generators))}
                </div>
              </div>
            )}
          </dispatchContext.Consumer>
        </ActionProvider>
      </Catch>
    )
    const tester = rtl.render(<Base />)

    // Record all errors.
    let topLevelErrors = []
    function handleTopLevelError(event) {
      topLevelErrors.push(event.error.message)
      // Prevent logging
      event.preventDefault()
    }

    const div = document.createElement("div")
    window.addEventListener("error", handleTopLevelError)
    try {
      rtl.fireEvent.click(tester.getByText("click"))
    } finally {
      window.removeEventListener("error", handleTopLevelError)
    }
    expect(tester.queryByText("got it!")).not.toBe(null)
  })
  describe("lifting", () => {
    class Mine extends React.Component {
      constructor(props) {
        super(props)
        this.state = {
          hi: "there"
        }
        this.sayHi = hi =>
          this.setState({ hi }, () => this.props.liftState("mine", this.state))
      }

      render() {
        return (
          <div>
            <button onClick={() => this.props.liftState("mine", this.state)}>
              click
            </button>
            <button onClick={() => this.setState({ hi: "wow" })}>change</button>
            <button onClick={() => this.props.sayHi("foo")}>do foo</button>
            <button
              onClick={() =>
                this.props.liftActions("mine", { sayHi: this.sayHi })
              }
            >
              lift actions
            </button>
            <button onClick={() => this.props.liftActions("mine", false)}>
              remove actions
            </button>
            <div>{this.props.sayHi ? "has it!" : "doesn't have it"}</div>
            <div>local: {this.state.hi}</div>
          </div>
        )
      }
    }
    function TestLifting({ setState }) {
      return (
        <ActionProvider setState={setState} monitor={() => null} actions={{}}>
          <dispatchContext.Consumer>
            {({ actions }) => {
              return (
                <Mine
                  liftState={actions.liftState}
                  liftActions={actions.liftActions}
                  sayHi={actions.mine && actions.mine.sayHi}
                />
              )
            }}
          </dispatchContext.Consumer>
        </ActionProvider>
      )
    }
    describe("liftState", () => {
      test("liftState sets global state", async () => {
        const setState = jest.fn(reducer => {
          expect(reducer({})).toEqual({ mine: { hi: "there" } })
        })
        const tester = rtl.render(<TestLifting setState={setState} />)
        expect(tester.queryByText("local: there")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("click"))
        await rtl.waitForElement(() => tester.getByText("local: there"))
        expect(tester.queryByText("local: there")).not.toBe(null)
        expect(setState).toHaveBeenCalled()
      })
    })
    describe("liftActions", () => {
      test("liftActions provides keyed actions", async () => {
        const setState = () => null
        const tester = rtl.render(<TestLifting setState={setState} />)
        expect(tester.queryByText("doesn't have it")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("lift actions"))

        await rtl.waitForElement(() => tester.getByText("has it!"))
        expect(tester.queryByText("has it!")).not.toBe(null)
      })
      test("lifted action works", async () => {
        const setState = () => null
        const tester = rtl.render(<TestLifting setState={setState} />)

        rtl.fireEvent.click(tester.getByText("lift actions"))

        await rtl.waitForElement(() => tester.getByText("has it!"))
        rtl.fireEvent.click(tester.getByText("do foo"))

        await rtl.waitForElement(() => tester.getByText("local: foo"))
        expect(tester.queryByText("local: foo")).not.toBe(null)
      })
      test("removing lifted actions works", async () => {
        const setState = () => null
        const tester = rtl.render(<TestLifting setState={setState} />)
        expect(tester.queryByText("doesn't have it")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("lift actions"))

        await rtl.waitForElement(() => tester.getByText("has it!"))
        expect(tester.queryByText("has it!")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("remove actions"))

        await rtl.waitForElement(() => tester.getByText("doesn't have it"))
        expect(tester.queryByText("doesn't have it")).not.toBe(null)
      })
    })
  })
})
