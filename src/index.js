import Provider, { async } from "./Provider.jsx"
import StateConsumer from "./StateConsumer.jsx"
import ActionConsumer from "./ActionConsumer.jsx"
import React from "react"
import { render } from "react-dom"
const $$observable = Symbol.for("observable")

function inc(state) {
  return { counter: state.counter + 1 }
}

function dec(state) {
  return { counter: state.counter - 1 }
}

const asyncTimer = {
  make: () => ({
    [$$observable]: () => this,
    subscribe(observer) {
      const timeout = setInterval(() => observer.next(), 1000)
      return { unsubscribe: () => clearInterval(timeout) }
    }
  }),
  init: (observable, actions, action) => ({
    next: actions.actions[action]
  }),
  start: (observable, observer) => observable.subscribe(observer)
}

const asyncDelay = {
  make: ms => new Promise((resolve) => {
    setTimeout(resolve, ms)
  }),
  init: (promise, actions, ms, action) => actions.actions[action],
  start: (promise, action) => promise.then(action)
}

const Button = ({ action, children, disabled = false }) => (
  <ActionConsumer
    render={({ actions }) => {
      return <button onClick={actions[action]} disabled={disabled}>{children}</button>
    }}
  />
)

const AsyncButton = ({ action, handle = () => null, args = [], children, disabled = false }) => (
  <ActionConsumer
    render={({ async }) => {
      return <button onClick={() => handle(async[action](...args))} disabled={disabled}>{children}</button>
    }}
  />
)

const Counter = () => <StateConsumer render={state => state.counter} />

class App extends React.Component {
  state = { timing: false, delay: false }

  render() {
    if (this.state.error) throw this.state.error
    return (
      <Provider
        initialState={{ counter: 0, timer: false }}
        actions={{
          inc,
          dec,
        }}
        async={{
          asyncTimer,
          asyncDelay,
        }}
      >
        <Button action="inc">+</Button>
        <Button action="dec">-</Button>
        {this.state.timing ?
          <button onClick={() => {
            this.state.timing.unsubscribe()
            this.setState({ timing: false })
          }}>stop counting</button>
          :
          <React.Fragment>
            <AsyncButton action="asyncTimer" handle={timing => this.setState({ timing })} args={['inc']}>count</AsyncButton>
            <AsyncButton action="asyncTimer" handle={timing => this.setState({ timing })} args={['dec']}>count down</AsyncButton>
          </React.Fragment>
        }
        <AsyncButton action="asyncDelay" args={[1500, 'inc']} handle={(delay) => {
          this.setState({ delay: true })
          delay
            .then(() => this.setState({ delay: false }))
            .catch(error => this.setState({ error, delay: false }))
        }} disabled={this.state.delay}>delay</AsyncButton>
        <AsyncButton action="asyncDelay" args={[1500, 'dec']} handle={(delay) => {
          this.setState({ delay: true })
          delay
            .then(() => this.setState({ delay: false }))
            .catch(error => this.setState({ error, delay: false }))
        }} disabled={this.state.delay}>delay down</AsyncButton>
        <div>
          <Counter/>
        </div>
      </Provider>
    )
  }
}

render(<App />, document.body)
