# Tiny
### A tiny react-based state management library

Refactor-focused, test-focused state management, with full support for asynchrony.

```js
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
  make: ms =>
    new Promise(resolve => {
      setTimeout(resolve, ms)
    }),
  init: (promise, actions, ms, action) => actions.actions[action],
  start: (promise, action) => promise.then(action)
}

const Button = ({ action, children, disabled = false }) => (
  <ActionConsumer
    render={({ actions: { actions } }) => {
      return (
        <button onClick={actions[action]} disabled={disabled}>
          {children}
        </button>
      )
    }}
  />
)

const AsyncButton = ({
  action,
  handle = () => null,
  args = [],
  children,
  disabled = false
}) => (
  <ActionConsumer
    render={({ actions: { generators } }) => {
      return (
        <button
          onClick={() => handle(generators[action](...args))}
          disabled={disabled}
        >
          {children}
        </button>
      )
    }}
  />
)

const Counter = () => <StateConsumer render={({ state }) => state.counter} />

class App extends React.Component {
  state = { timing: false, delay: false }

  render() {
    if (this.state.error) throw this.state.error
    return (
      <Provider
        initialState={{ counter: 0, timer: false }}
        actions={{
          inc,
          dec
        }}
        asyncActionGenerators={{
          asyncTimer,
          asyncDelay
        }}
      >
        <Button action="inc">+</Button>
        <Button action="dec">-</Button>
        {this.state.timing ? (
          <button
            onClick={() => {
              this.state.timing.unsubscribe()
              this.setState({ timing: false })
            }}
          >
            stop counting
          </button>
        ) : (
          <React.Fragment>
            <AsyncButton
              action="asyncTimer"
              handle={timing => this.setState({ timing })}
              args={["inc"]}
            >
              count
            </AsyncButton>
            <AsyncButton
              action="asyncTimer"
              handle={timing => this.setState({ timing })}
              args={["dec"]}
            >
              count down
            </AsyncButton>
          </React.Fragment>
        )}
        <AsyncButton
          action="asyncDelay"
          args={[1500, "inc"]}
          handle={delay => {
            this.setState({ delay: true })
            delay
              .then(() => this.setState({ delay: false }))
              .catch(error => this.setState({ error, delay: false }))
          }}
          disabled={this.state.delay}
        >
          delay
        </AsyncButton>
        <AsyncButton
          action="asyncDelay"
          args={[1500, "dec"]}
          handle={delay => {
            this.setState({ delay: true })
            delay
              .then(() => this.setState({ delay: false }))
              .catch(error => this.setState({ error, delay: false }))
          }}
          disabled={this.state.delay}
        >
          delay down
        </AsyncButton>
        <div>
          <Counter />
        </div>
      </Provider>
    )
  }
}

const div = document.body.appendChild(document.createElement("div"))
render(<App />, div)
```


## Key features

### build local first, then lift state

Build your state locally, then if another component needs access to the state, lift it up:

```js
class MyClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      something: 1
    }
    this.changeSomething = () => this.SetState({ something: 2 })
  }

  componentDidUpdate(nextProps) {
    if (lastProps.blah !== this.props.blah) {
      api.load(this.props.blah)
      .then(thing => 
        this.setState(state => {
          return { something: state.something + thing}
        }))
    }
  }

  render() {
    return (
      <div>
        {this.state.something}
        <button onClick={this.changeSomething}>+</button>
      </div>
    )
  }
}
```

lift:

```js
import { lift, liftSetState } from 'tiny'


class MyClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.props.initState('myclass', {
      something: 1
    })
    this.liftedSetState = liftSetState(this, 'myclass')
    this.changeSomething = () => this.liftedSetState({ something: 2 })
  }


  componentDidMount() {
    this.props.liftActions('myclass', { changeSomething: this.changeSomething })
  }

  componentDidUpdate(nextProps) {
    if (lastProps.blah !== this.props.blah) {
      api.load(this.props.blah)
      .then(thing => 
        this.liftedSetState(state => {
          return { something: state.something + thing}
        }))
    }
  }

  render() {
    return (
      <div>
        {this.state.something}
        <button onClick={this.changeSomething}>+</button>
      </div>
    )
  }
}

export default lift(MyClass)
```

Now, other components can access your component's state and actions:

```js
const Fancy = ({ state, actions: { actions } }) => (
  <div>
    {state.myclass.something}
    <button onClick={actions.myclass.changeSomething}>change it!</button>
  </div>
)

const ConnectFancy = (
  <Consumer render={Fancy} />
)
```

### Build asynchronous action generators that are pure and testable

### Build for correctness, and add speed easily later

Using `SubProvider` and observed bits mappers, speed can easily be applied in components
that render too often. No need for confusing solutions like reselect.