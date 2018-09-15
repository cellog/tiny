import React from "react"
import { func, objectOf, shape } from "prop-types"
import { dispatchContext } from "./Provider"

export default class ActionProvider extends React.Component {
  static propTypes = {
    actions: objectOf(func),
    asyncActionGenerators: objectOf(
      shape({
        make: func,
        init: func,
        start: func
      })
    ),
    setState: func.isRequired,
    monitor: func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      setError: this.setState.bind(this),
      error: false,
      actions: { actions: {}, generators: {} }
    }
    const res = ActionProvider.bindActions(this.props, this.state)
    if (res !== null) {
      this.state.actions = res.actions
    }
  }

  static getDerivedStateFromProps(props, state) {
    return ActionProvider.bindActions(props, state)
  }

  static bindActions(props, state) {
    const ret = {
      actions: {
        actions: {},
        generators: {}
      }
    }
    let actionsUpdated = false
    let generatorsUpdated = false
    const setError = state.setError
    const actionUpdates = {
      liftState: (key, substate) => {
        props.setState(state => {
          if (state[key] === substate) return null
          return { [key]: substate }
        }, props.monitor)
      },
      liftActions: (key, actions) => {
        if (!actions) {
          setError(state => {
            const actions = {
              ...state.actions,
              actions: { ...state.actions.actions }
            }
            delete actions.actions[key]
            return {
              actions
            }
          }, props.monitor("liftActions", false))
          return
        }
        setError(
          state => ({
            actions: {
              ...state.actions,
              actions: {
                ...state.actions.actions,
                [key]: actions
              }
            }
          }),
          props.monitor("liftActions", false)
        )
      }
    }

    const generatorUpdates = {}

    if (!props.actions || Object.keys(props.actions).length === 0) {
      // no actions declared, but we still need liftState and liftActions
      actionsUpdated = true
    }

    for (let action in props.actions) {
      if (
        state.actions.actions[action] &&
        state.actions.actions[action].action === props.actions[action]
      )
        continue
      actionsUpdated = true
      const reducer = props.actions[action]
      actionUpdates[action] = (...args) => {
        props.setState(state => {
          let ret
          try {
            ret = reducer(state, ...args)
            if (ret === null) return ret
          } catch (error) {
            setError({ error })
            return null
          }
        }, props.monitor(action, reducer))
      }
      actionUpdates[action].action = reducer
    }

    for (let schema in props.asyncActionGenerators) {
      if (
        state.actions.generators[schema] &&
        state.actions.generators[schema].schema ===
          props.asyncActionGenerators[schema]
      )
        continue
      generatorsUpdated = true
      const sequence = props.asyncActionGenerators[schema]
      generatorUpdates[schema] = (...args) => {
        try {
          const asyncActionGenerator = sequence.make(...args)
          const initializedGenerator = sequence.init(
            asyncActionGenerator,
            ret.actions,
            ...args
          )
          return sequence.start(
            asyncActionGenerator,
            initializedGenerator,
            ret.actions,
            ...args
          )
        } catch (error) {
          setError({ error })
        }
      }
      generatorUpdates[schema].schema = sequence
    }

    if (!actionsUpdated && !generatorsUpdated) {
      return null
    }

    if (actionsUpdated) {
      ret.actions.actions = { ...state.actions.actions, ...actionUpdates }
    } else {
      ret.actions.actions = state.actions.actions
    }
    if (generatorsUpdated) {
      ret.actions.generators = {
        ...state.actions.generators,
        ...generatorUpdates
      }
    } else {
      ret.actions.generators = state.actions.generators
    }
    return ret
  }

  render() {
    if (this.state.error) throw this.state.error
    return (
      <dispatchContext.Provider value={this.state.actions}>
        {this.props.children}
      </dispatchContext.Provider>
    )
  }
}
