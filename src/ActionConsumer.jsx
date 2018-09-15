import React from "react"
import { dispatchContext } from "./Provider.jsx"

export function actionConsumer(context = dispatchContext) {
  return class ActionConsumer extends React.PureComponent {
    renderChild = actions => {
      const props = Object.assign({}, this.props)
      delete props.render
      return this.props.render({ actions, props })
    }

    render() {
      return <context.Consumer>{this.renderChild}</context.Consumer>
    }
  }
}

export default actionConsumer()
