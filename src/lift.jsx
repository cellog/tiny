import React from 'react'
import { bothContext } from "./Provider"

export default function lift(Component) {
  return props => (
    <bothContext.Consumer>
      {({ state, actions: { actions: { liftState, liftActions } } } ) => {
        const initState = (key, defaultState) => state[key] !== undefined ? state[key] : defaultState
        return <Component {...props} liftState={liftState} liftActions={liftActions} initState={initState} />
      }}
    </bothContext.Consumer>
  )
}
