import React from "react"
import { bothContext, stateContext } from "./Provider"

export default class SubProvider extends React.Component {
  constructor(props) {
    super(props)
    this.subrender = this.subrender.bind(this)
  }

  subrender(value) {
    let state = this.props.selector(value)
    return (
      <stateContext.Provider value={state}>
        {this.props.children}
      </stateContext.Provider>
    )
  }

  render() {
    return <stateContext.Consumer>{this.subrender}</stateContext.Consumer>
  }
}
