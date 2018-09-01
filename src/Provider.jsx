import React, { Component } from "react"

const dispatchContext = React.createContext()
const stateContext = React.createContext()
const bothContext = React.createContext()
export { dispatchContext, stateContext, bothContext }
const $$observable = Symbol("observable")

export default class Provider extends Component {
  static defaultProps = {
    dispatchContext: dispatchContext,
    stateContext: stateContext,
    bothContext: bothContext,
    actions: []
  }
  constructor(props) {
    super(props)
    this.mounted = false
    this.state = {
      state: this.props.initialState,
      actions: this.bindActions(this.props.actions),
      error: false
    }
    this.error = false
    this.subscribed = []
  }

  updateState = (action, ...args) => {
    const { resolver, saveUnsubscribe } = action
    this.setState(state => {
      let ret
      try {
        ret = action(state.state, ...args)
        if (ret === null) return ret
      } catch (error) {
        return { error }
      }
      const resolved = result => {
        console.log(result)
        return this.mounted && resolver
          ? this.updateState(resolver, result)
          : result
      }
      const handleError = error => this.mounted && this.setState({ error })
      console.log("in", ret)
      if (ret.then instanceof Function) {
        // promise
        ret.then(resolved).catch(handleError)
        return null
      } else if (ret.subscribe instanceof Function) {
        if (ret[$$observable]) {
          // observable
          const observer = {
            next: resolved,
            error: handleError
          }
          console.log("in o", observer, ret)
          const result = ret.subscribe(observer)
          saveUnsubscribe ? saveUnsubscribe(result) : null
          this.subscribed.push(result)
          return null
        }
        // pub/sub event emitter
        const result = ret.subscribe(resolved)
        saveUnsubscribe ? saveUnsubscribe(result) : null
        this.subscribed.push(result)
        return null
      }
      // synchronous reducer
      return { state: ret }
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

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
    this.subscribed.forEach(unsubscribe => unsubscribe())
    this.subscribed = []
  }

  componentDidUpdate(lastProps) {
    if (lastProps.actions !== this.props.actions) {
      this.setState({ actions: this.bindActions(this.props.actions) })
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
