import React from "react"
import { stateContext } from "./Provider.jsx"

export function stateConsumer(context = stateContext) {
  return class StateConsumer extends React.Component {
    renderChild = state => {
      const props = Object.assign({}, this.props)
      delete props.render
      delete props.observedBits
      return this.props.render({ state, props })
    }

    render() {
      if (this.props.observedBits) {
        return (
          <context.Consumer unstable_observedBits={this.props.observedBits}>
            {this.renderChild}
          </context.Consumer>
        )
      }
      return <context.Consumer>{this.renderChild}</context.Consumer>
    }
  }
}

export default stateConsumer()
