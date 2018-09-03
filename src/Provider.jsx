import React, { Component } from "react"

const dispatchContext = React.createContext()
const stateContext = React.createContext()
const bothContext = React.createContext()
export { dispatchContext, stateContext, bothContext }

export default class Provider extends Component {
  static defaultProps = {
    dispatchContext: dispatchContext,
    stateContext: stateContext,
    bothContext: bothContext,
    actions: [],
    asyncActions: []
  }
  constructor(props) {
    super(props)
    this.mounted = false
    this.state = {
      state: this.props.initialState,
      actions: {
        actions: this.bindActions(this.props.actions),
        async: this.bindAsyncHandlers(this.props.async),
      },
      error: false
    }
    this.error = false
    this.subscribed = []
  }

  updateState = (action, ...args) => {
    this.setState(state => {
      let ret
      try {
        ret = action(state.state, ...args)
        if (ret === null) return ret

        return { state: ret }
      } catch (error) {
        return { error }
      }
    }, this.props.monitor ? () => this.props.monitor(this.state.state) : undefined)
  }

  bindActions(actions) {
    return Object.keys(actions).reduce(
      (boundActions, action) => ({
        ...boundActions,
        [action]: (...args) => {
          this.updateState(actions[action], ...args)
        }
      }),
      {}
    )
  }

  bindAsyncHandlers(actions) {
    return Object.keys(actions).reduce(
      (boundActions, action) => ({
        ...boundActions,
        [action]: (...args) => {
          const sequence = actions[action]
          const asyncThing = sequence.make(...args)
          const initThing = sequence.init(asyncThing, this.state.actions, ...args)
          return sequence.start(asyncThing, initThing)
        }
      }),
      {}
    )
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
    this.subscribed.forEach(unsubscribe => unsubscribe())
    this.subscribed = []
  }

  componentDidUpdate(lastProps) {
    if (lastProps.actions !== this.props.actions || lastProps.async !== this.props.async) {
      this.setState({
        actions: {
          async: this.bindAsyncHandlers(this.props.async),
          actions: this.bindActions(this.props.actions)
        }
      })
    }
  }

  render() {
    if (this.state.error) throw this.state.error
    const { dispatchContext, stateContext, bothContext } = this.props
    return (
      <dispatchContext.Provider value={this.state.actions}>
        <stateContext.Provider value={this.state.state}>
          <bothContext.Provider value={this.state}>
            {this.props.children}
          </bothContext.Provider>
        </stateContext.Provider>
      </dispatchContext.Provider>
    )
  }
}
