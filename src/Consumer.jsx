import React from "react"
import { bothContext } from "./Provider.jsx"

export function consumer(context = bothContext) {
  return class Consumer extends React.Component {
    renderChild = ({ state, actions }) => {
      const props = Object.assign({}, this.props)
      delete props.render
      delete props.observedBits
      return this.props.render({ state, props, actions })
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

export default consumer()
