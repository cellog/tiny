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
    }, this.props.monitor ? () => this.props.monitor(action, this.state.state) : undefined)
  }

  bindActions(actions = []) {
    if (actions.liftState) {
      throw new Error("liftState is a reserved action")
    }
    return Object.keys(actions).reduce(
      (boundActions, action) => ({
        ...boundActions,
        [action]: (...args) => {
          this.updateState(actions[action], ...args)
        }
      }),
      {
        liftState: (key, substate) => {
          if (!this.mounted) return
          this.updateState(
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
            })
            return
          }
          this.setState(state => ({
            actions: {
              ...state.actions,
              actions: {
                ...state.actions.actions,
                [key]: actions
              }
            }
          }))
        }
      }
    )
  }

  bindAsyncHandlers(actions = []) {
    return Object.keys(actions).reduce(
      (boundActions, action) => ({
        ...boundActions,
        [action]: (...args) => {
          const sequence = actions[action]
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
      }),
      {}
    )
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
