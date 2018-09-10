import React from "react"
import * as rtl from "react-testing-library"
import Provider, {
  stateContext,
  dispatchContext,
  bothContext
} from "../src/Provider"
import "jest-dom/extend-expect"
import "react-testing-library/cleanup-after-each"

describe("Provider correctness", () => {
  describe("contexts", () => {
    const ContextTester = ({ children }) => (
      <Provider
        initialState={{ test: "thing" }}
        actions={{ one: () => null }}
        asyncActionGenerators={{ one: { make() {}, init() {}, start() {} } }}
      >
        {children}
      </Provider>
    )
    test("stateContext", () => {
      const tester = rtl.render(
        <ContextTester>
          <stateContext.Consumer>
            {state => <div data-testid="state">{JSON.stringify(state)}</div>}
          </stateContext.Consumer>
        </ContextTester>
      )
      expect(tester.getByTestId("state")).toHaveTextContent(
        JSON.stringify({ test: "thing" })
      )
    })
    test("dispatchContext", () => {
      const tester = rtl.render(
        <ContextTester>
          <dispatchContext.Consumer>
            {actions => (
              <div data-testid="state">
                {JSON.stringify(Object.keys(actions.actions)) +
                  JSON.stringify(Object.keys(actions.generators))}
              </div>
            )}
          </dispatchContext.Consumer>
        </ContextTester>
      )
      expect(tester.getByTestId("state")).toHaveTextContent(
        JSON.stringify(["liftState", "liftActions", "one"]) +
          JSON.stringify(["one"])
      )
    })
    test("bothContext", () => {
      const tester = rtl.render(
        <ContextTester>
          <bothContext.Consumer>
            {({ state, actions }) => (
              <div data-testid="state">
                {JSON.stringify(state) +
                  JSON.stringify(Object.keys(actions.actions)) +
                  JSON.stringify(Object.keys(actions.generators))}
              </div>
            )}
          </bothContext.Consumer>
        </ContextTester>
      )
      expect(tester.getByTestId("state")).toHaveTextContent(
        JSON.stringify({ test: "thing" }) +
          JSON.stringify(["liftState", "liftActions", "one"]) +
          JSON.stringify(["one"])
      )
    })
  })

  test("initial state", () => {
    const initial = {
      test: "hi"
    }

    const test = rtl.render(
      <Provider initialState={initial}>
        <stateContext.Consumer>
          {({ test }) => {
            return (
              <div>
                <div>{test}</div>
              </div>
            )
          }}
        </stateContext.Consumer>
      </Provider>
    )

    expect(test.queryByText("hi")).not.toBe(null)
  })
  describe("normal actions", () => {
    test("action binds", () => {
      const initial = {
        test: "hi"
      }

      const action = jest.fn((state, something) => {
        return {
          test: something
        }
      })

      const test = rtl.render(
        <Provider initialState={initial} actions={{ action }}>
          <bothContext.Consumer>
            {({ state, actions }) => {
              return (
                <div>
                  <button onClick={() => actions.actions.action("other")}>
                    click
                  </button>
                  <div>{state.test}</div>
                </div>
              )
            }}
          </bothContext.Consumer>
        </Provider>
      )

      expect(test.queryByText("hi")).not.toBe(null)
      rtl.fireEvent.click(test.getByText("click"))
      expect(test.queryByText("other")).not.toBe(null)
      expect(action).toHaveBeenCalled()
      expect(action.mock.calls[0]).toEqual([initial, "other"])

      rtl.fireEvent.click(test.getByText("click"))
      expect(action.mock.calls[1]).toEqual([{ test: "other" }, "other"])
    })
    test("updates actions", () => {
      const initial = {
        test: "hi"
      }

      const action = jest.fn((state, something) => {
        return {
          test: something
        }
      })

      const action2 = jest.fn((state, something) => {
        return {
          test: something + "2"
        }
      })

      const get = action => (
        <Provider initialState={initial} actions={{ action }}>
          <bothContext.Consumer>
            {({ state, actions }) => {
              return (
                <div>
                  <button onClick={() => actions.actions.action("other")}>
                    click
                  </button>
                  <div>{state.test}</div>
                </div>
              )
            }}
          </bothContext.Consumer>
        </Provider>
      )

      const test = rtl.render(get(action))

      expect(test.queryByText("hi")).not.toBe(null)
      rtl.fireEvent.click(test.getByText("click"))
      expect(test.queryByText("other")).not.toBe(null)
      expect(action.mock.calls[0]).toEqual([initial, "other"])

      test.rerender(get(action2))
      rtl.fireEvent.click(test.getByText("click"))
      expect(test.queryByText("other2")).not.toBe(null)
      expect(action2.mock.calls[0]).toEqual([{ test: "other" }, "other"])
    })
  })
  describe("asynchronous action generators", () => {
    test("async handlers", () => {
      const initial = {
        test: "hi"
      }

      const action = jest.fn((state, something) => {
        return {
          test: something
        }
      })

      const dummyAsync = {}
      const dummyInit = {}
      const async = {
        make: jest.fn((...args) => {
          return dummyAsync
        }),
        init: jest.fn((makeReturn, actions, ...args) => {
          return dummyInit
        }),
        start: jest.fn((makeReturn, initReturn, actions, ...arg) => {
          return 5
        })
      }
      let ret

      const test = rtl.render(
        <Provider
          initialState={initial}
          actions={{ action }}
          asyncActionGenerators={{ async }}
        >
          <bothContext.Consumer>
            {({ state, actions }) => {
              return (
                <div>
                  <button
                    onClick={() =>
                      (ret = actions.generators.async("argument", "two"))
                    }
                  >
                    click
                  </button>
                </div>
              )
            }}
          </bothContext.Consumer>
        </Provider>
      )

      rtl.fireEvent.click(test.getByText("click"))

      expect(ret).toBe(5)
      expect(async.make.mock.calls[0]).toEqual(["argument", "two"])

      expect(async.init.mock.calls[0][0]).toEqual(dummyAsync)
      expect(Object.keys(async.init.mock.calls[0][1].actions)).toEqual([
        "liftState",
        "liftActions",
        "action"
      ])
      expect(Object.keys(async.init.mock.calls[0][1].generators)).toEqual([
        "async"
      ])
      expect(async.init.mock.calls[0][2]).toEqual("argument")
      expect(async.init.mock.calls[0][3]).toEqual("two")

      expect(async.start.mock.calls[0][0]).toBe(dummyAsync)
      expect(async.start.mock.calls[0][1]).toBe(dummyInit)
      expect(Object.keys(async.start.mock.calls[0][2].actions)).toEqual([
        "liftState",
        "liftActions",
        "action"
      ])
      expect(Object.keys(async.start.mock.calls[0][2].generators)).toEqual([
        "async"
      ])
      expect(async.start.mock.calls[0][3]).toEqual("argument")
      expect(async.start.mock.calls[0][4]).toEqual("two")
    })
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
            <div>{this.props.sayHi ? "has it!" : "does not have it"}</div>
            <div>local: {this.state.hi}</div>
            <div>
              global: {this.props.state.mine && this.props.state.mine.hi}
            </div>
          </div>
        )
      }
    }
    function TestLifting() {
      return (
        <Provider initialState={{}}>
          <bothContext.Consumer>
            {({ state, actions }) => {
              return (
                <Mine
                  liftState={actions.actions.liftState}
                  liftActions={actions.actions.liftActions}
                  sayHi={actions.actions.mine && actions.actions.mine.sayHi}
                  state={state}
                />
              )
            }}
          </bothContext.Consumer>
        </Provider>
      )
    }
    describe("liftState", () => {
      test("liftState sets global state", async () => {
        const tester = rtl.render(<TestLifting />)
        expect(tester.queryByText("local: there")).not.toBe(null)
        expect(tester.queryByText("global:")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("click"))
        await rtl.waitForElement(() => tester.getByText("global: there"))
        expect(tester.queryByText("local: there")).not.toBe(null)
        expect(tester.queryByText("global: there")).not.toBe(null)
      })
      test("liftState responds to changes to local state", async () => {
        const tester = rtl.render(<TestLifting />)
        expect(tester.queryByText("local: there")).not.toBe(null)
        expect(tester.queryByText("global:")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("click"))
        await rtl.waitForElement(() => tester.getByText("global: there"))
        expect(tester.queryByText("local: there")).not.toBe(null)
        expect(tester.queryByText("global: there")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("change"))
        await rtl.waitForElement(() => tester.getByText("local: wow"))
        expect(tester.queryByText("local: wow")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("click"))
        await rtl.waitForElement(() => tester.getByText("global: wow"))
        expect(tester.queryByText("global: wow")).not.toBe(null)
      })
    })
    describe("liftActions", () => {
      test("liftActions provides keyed actions", async () => {
        const tester = rtl.render(<TestLifting />)
        expect(tester.queryByText("does not have it")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("lift actions"))

        await rtl.waitForElement(() => tester.getByText("has it!"))
        expect(tester.queryByText("has it!")).not.toBe(null)
      })
      test("lifted action works", async () => {
        const tester = rtl.render(<TestLifting />)

        rtl.fireEvent.click(tester.getByText("lift actions"))

        await rtl.waitForElement(() => tester.getByText("has it!"))
        rtl.fireEvent.click(tester.getByText("do foo"))

        await rtl.waitForElement(() => tester.getByText("local: foo"))
        expect(tester.queryByText("local: foo")).not.toBe(null)

        await rtl.waitForElement(() => tester.getByText("global: foo"))
        expect(tester.queryByText("global: foo")).not.toBe(null)
      })
      test("removing lifted actions works", async () => {
        const tester = rtl.render(<TestLifting />)
        expect(tester.queryByText("does not have it")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("lift actions"))

        await rtl.waitForElement(() => tester.getByText("has it!"))
        expect(tester.queryByText("has it!")).not.toBe(null)

        rtl.fireEvent.click(tester.getByText("remove actions"))

        await rtl.waitForElement(() => tester.getByText("does not have it"))
        expect(tester.queryByText("does not have it")).not.toBe(null)
      })
    })
  })
  describe("monitor", () => {
    const one = state => ({ ...state, one: "thing" })
    const two = state => ({ ...state, one: "other thing" })
    let monitor
    function Monitor({ monitor }) {
      return (
        <Provider
          initialState={{ one: "no" }}
          actions={{
            one,
            two
          }}
          monitor={monitor}
        >
          <bothContext.Consumer>
            {({ actions, state }) => {
              return (
                <div>
                  <button onClick={actions.actions.one}>one</button>
                  <button onClick={actions.actions.two}>two</button>
                  <div>{state.one}</div>
                </div>
              )
            }}
          </bothContext.Consumer>
        </Provider>
      )
    }
    test("monitor receives action and state", () => {
      monitor = jest.fn((action, state) => null)
      const tester = rtl.render(<Monitor monitor={monitor} />)
      rtl.fireEvent.click(tester.getByText("one"))

      rtl.waitForElement(() => tester.getByText("thing"))
      expect(monitor).toHaveBeenCalled()
      expect(monitor.mock.calls[0][0]).toBe(one)
      expect(monitor.mock.calls[0][1]).toEqual({ one: "thing" })

      rtl.fireEvent.click(tester.getByText("two"))

      rtl.waitForElement(() => tester.getByText("other thing"))
      expect(monitor.mock.calls[1][0]).toBe(two)
      expect(monitor.mock.calls[1][1]).toEqual({ one: "other thing" })
    })
  })
  test("nothing happens if we are unmounted", async () => {
    const thing = jest.fn(state => ({ hi: "oops" }))
    let saveThing, saveLiftState, saveLiftActions
    const tester = rtl.render(
      <Provider actions={{ thing }} initialState={{ hi: "there" }}>
        <bothContext.Consumer>
          {({
            state,
            actions: {
              actions: { liftState, liftActions, thing }
            }
          }) => {
            saveThing = thing
            saveLiftState = liftState
            saveLiftActions = liftActions
            return (
              <div>
                <div>hi</div>
                <div data-testid="hi">{JSON.stringify(state)}</div>
              </div>
            )
          }}
        </bothContext.Consumer>
      </Provider>
    )
    await rtl.waitForElement(() => tester.getByText("hi"))
    tester.unmount()
    const error = console.error
    console.error = jest.fn(console.error)

    try {
      saveThing()
      expect(thing).not.toHaveBeenCalled()
      saveLiftState("oops", { hi: "there" })
      expect(console.error).not.toHaveBeenCalled()
      saveLiftActions("key", { saveThing })
      expect(console.error).not.toHaveBeenCalled()
    } finally {
      console.error = error
    }
  })
  describe("errors", () => {
    test("overriding liftState", () => {
      expect(() =>
        rtl.render(<Provider actions={{ liftState: () => null }} />)
      ).toThrow(
        'action "liftState" is a reserved action, and cannot be overridden'
      )
    })
    test("overriding liftActions", () => {
      expect(() =>
        rtl.render(<Provider actions={{ liftActions: () => null }} />)
      ).toThrow(
        'action "liftActions" is a reserved action, and cannot be overridden'
      )
    })
  })
})
