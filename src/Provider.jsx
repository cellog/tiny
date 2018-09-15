import React, { Component } from "react"
import { func, objectOf, shape } from "prop-types"
import ActionProvider from "./ActionProvider"

const dispatchContext = React.createContext()
const stateContext = React.createContext()
const restoreContext = React.createContext()
export { dispatchContext, stateContext, restoreContext }

export default class Provider extends Component {
  static propTypes = {
    actions: objectOf(func),
    asyncActionGenerators: objectOf(
      shape({
        make: func.isRequired,
        init: func.isRequired,
        start: func.isRequired
      })
    )
  }

  static defaultProps = {
    dispatchContext: dispatchContext,
    stateContext: stateContext,
    actions: {},
    asyncActionGenerators: {}
  }

  constructor(props) {
    super(props)
    this.state = this.props.initialState
    this.setState = this.setState.bind(this)
    this.monitor = (name, action) =>
      this.props.monitor
        ? () => this.props.monitor(name, action, this.state)
        : undefined
  }

  render() {
    const { dispatchContext, stateContext } = this.props
    return (
      <stateContext.Provider value={this.state}>
        <restoreContext.Provider value={this.state}>
          <ActionProvider
            setState={this.setState}
            monitor={this.monitor}
            actions={this.props.actions}
            asyncActionGenerators={this.props.asyncActionGenerators}
          >
            {this.props.children}
          </ActionProvider>
        </restoreContext.Provider>
      </stateContext.Provider>
    )
  }
}
