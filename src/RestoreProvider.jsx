import React from "react"
import { restoreContext, stateContext } from "./Provider"

export default class RestoreProvider extends React.Component {
  constructor(props) {
    super(props)
    this.renderRestore = state => {
      return (
        <stateContext.Provider value={state}>
          {this.props.children}
        </stateContext.Provider>
      )
    }
  }

  render() {
    return (
      <restoreContext.Consumer>{this.renderRestore}</restoreContext.Consumer>
    )
  }
}
