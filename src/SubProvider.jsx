import React from 'react'
import { bothContext, stateContext } from './Provider'

export default class SubProvider extends React.Component {
  constructor(props) {
    super(props)
    this.subrender = this.subrender.bind(this)
  }

  subrender(value) {
    let state = this.props.selector(value.state)
    const bothValue = {
      ...value,
      state
    }
    return (
      <bothContext.Provider value={bothValue}>
        <stateContext.Provider value={state}>
          {this.props.children}
        </stateContext.Provider>
      </bothContext.Provider>
    )
  }

  render() {
    return (
      <bothContext.Consumer>
        {this.subrender}
      </bothContext.Consumer>
    )
  }
}