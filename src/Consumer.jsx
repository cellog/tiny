import React from "react"
import { stateContext, dispatchContext } from "./Provider.jsx"

export function consumer(sc = stateContext, dc = dispatchContext) {
  return class Consumer extends React.PureComponent {
    renderChild = state => actions => {
      const props = Object.assign({}, this.props)
      delete props.render
      delete props.observedBits
      return this.props.render({ state, props, actions })
    }

    render() {
      if (this.props.observedBits) {
        return (
          <sc.Consumer unstable_observedBits={this.props.observedBits}>
            {state => <dc.Consumer>{this.renderChild(state)}</dc.Consumer>}
          </sc.Consumer>
        )
      }
      return (
        <sc.Consumer>
          {state => <dc.Consumer>{this.renderChild(state)}</dc.Consumer>}
        </sc.Consumer>
      )
    }
  }
}

export default consumer()
