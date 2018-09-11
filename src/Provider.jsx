import React, { Component } from "react"
import invariant from "invariant"

const dispatchContext = React.createContext()
const stateContext = React.createContext()
const bothContext = React.createContext()
const restoreContext = React.createContext()
export { dispatchContext, stateContext, bothContext, restoreContext }

export default class Provider extends Component {
  static defaultProps = {
    dispatchContext: dispatchContext,
    stateContext: stateContext,
    bothContext: bothContext,
    actions: [],
    asyncActionGenerators: []
  }

  constructor(props) {
    super(props)
    this.mounted = false
    this.state = {
      state: this.props.initialState,
      actions: {
        actions: this.bindActions(this.props.actions),
        generators: this.bindAsyncHandlers(this.props.asyncActionGenerators)
      },
      error: false
    }
    this.error = false
  }

  updateState = (name, action, ...args) => {
    this.setState(state => {
      let ret
      try {
        ret = action(state.state, ...args)
        if (ret === null) return ret
        return { state: Object.assign({}, state.state, ret) }
      } catch (error) {
        return { error }
      }
    }, this.props.monitor ? () => this.props.monitor(name, action, this.state.state) : undefined)
  }

  bindActions(actions) {
    invariant(
      typeof actions === "object" && actions !== null,
      `actions must be an object, was passed ${
        actions === null ? "null" : "a " + typeof actions
      }`
    )
    invariant(
      actions.liftState === undefined,
      `action "liftState" is a reserved action, and cannot be overridden`
    )
    invariant(
      actions.liftActions === undefined,
      `action "liftActions" is a reserved action, and cannot be overridden`
    )
    return Object.keys(actions).reduce(
      (boundActions, action) => {
        invariant(
          typeof actions[action] === "function",
          `action "${action}" must be a function`
        )
        return {
          ...boundActions,
          [action]: (...args) => {
            if (!this.mounted) return
            this.updateState(action, actions[action], ...args)
          }
        }
      },
      {
        liftState: (key, substate) => {
          if (!this.mounted) return
          this.updateState(
            "liftState",
            (state, key, substate) => {
              if (state[key] === substate) return null
              return { [key]: substate }
            },
            key,
            substate
          )
        },
        liftActions: (key, actions) => {
          if (!this.mounted) return
          if (!actions) {
            this.setState(state => {
              const actions = { ...state.actions.actions }
              delete actions[key]
              return {
                actions: {
                  ...state.actions,
                  actions
                }
              }
            }, this.props.monitor ? () => this.props.monitor("liftActions", false, this.state.state, this.state.actions.actions) : undefined)
            return
          }
          this.setState(
            state => ({
              actions: {
                ...state.actions,
                actions: {
                  ...state.actions.actions,
                  [key]: actions
                }
              }
            }),
            this.props.monitor
              ? () =>
                  this.props.monitor(
                    "liftActions",
                    false,
                    this.state.state,
                    this.state.actions.actions
                  )
              : undefined
          )
        }
      }
    )
  }

  bindAsyncHandlers(actions = []) {
    return Object.keys(actions).reduce((boundActions, action) => {
      const sequence = actions[action]
      invariant(
        sequence &&
          typeof sequence.make === "function" &&
          typeof sequence.init === "function" &&
          typeof sequence.start === "function",
        `async action generator "${action}" must by an object, with members "make", "init" and "start"`
      )
      return {
        ...boundActions,
        [action]: (...args) => {
          const asyncActionGenerator = sequence.make(...args)
          const initializedGenerator = sequence.init(
            asyncActionGenerator,
            this.state.actions,
            ...args
          )
          return sequence.start(
            asyncActionGenerator,
            initializedGenerator,
            this.state.actions,
            ...args
          )
        }
      }
    }, {})
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  componentDidUpdate(lastProps) {
    if (
      lastProps.actions !== this.props.actions ||
      lastProps.asyncActionGenerators !== this.props.asyncActionGenerators
    ) {
      this.setState({
        actions: {
          generators: this.bindAsyncHandlers(this.props.asyncActionGenerators),
          actions: this.bindActions(this.props.actions)
        }
      })
    }
  }

  render() {
    if (this.state.error) throw this.state.error
    const { dispatchContext, stateContext, bothContext } = this.props
    if (this.props.initialState === undefined) {
      // check to see if we have a parent context above
      const fromParent = restoreContext.unstable_read()

      if (fromParent !== undefined) {
        return (
          <stateContext.Provider value={fromParent.state}>
            <bothContext.Provider value={fromParent}>
              {this.props.children}
            </bothContext.Provider>
          </stateContext.Provider>
        )
      }
    }
    return (
      <dispatchContext.Provider value={this.state.actions}>
        <stateContext.Provider value={this.state.state}>
          <bothContext.Provider value={this.state}>
            <restoreContext.Provider value={this.state}>
              {this.props.children}
            </restoreContext.Provider>
          </bothContext.Provider>
        </stateContext.Provider>
      </dispatchContext.Provider>
    )
  }
}
