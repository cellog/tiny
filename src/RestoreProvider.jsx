import React from "react"
import { bothContext, restoreContext, stateContext } from "./Provider"

export default class RestoreProvider extends React.Component {
  constructor(props) {
    super(props)
    this.renderRestore = state => {
      return (
        <stateContext.Provider value={state.state}>
          <bothContext.Provider value={state}>
            {this.props.children}
          </bothContext.Provider>
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
