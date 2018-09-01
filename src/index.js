import Provider from "./Provider.jsx"
import StateConsumer from "./StateConsumer.jsx"
import ActionConsumer from "./ActionConsumer.jsx"
import React from "react"
import { render } from "react-dom"
const $$observable = Symbol("observable")

function inc(state) {
  return { counter: state.counter + 1 }
}

function dec(state) {
  return { counter: state.counter - 1 }
}

const Button = ({ action, children }) => (
  <ActionConsumer
    render={({ actions }) => (
      <button onClick={actions[action]}>{children}</button>
    )}
  />
)

let cancel
function startCounting(state) {
  let timeout
  console.log("start")
  return {
    [$$observable]: () => this,
    subscribe(observer) {
      console.log("o", observer)
      timeout = setInterval(() => observer.next(), 1000)
      return { unsubscribe: () => clearInterval(timeout) }
    }
  }
}

function stopCounting(state) {
  console.log(cancel)
  if (cancel) cancel()
  cancel = false
  return null
}

startCounting.resolver = inc
startCounting.saveUnsubscribe = result => {
  console.log(result)
  cancel = result.unsubscribe
}

const Counter = () => <StateConsumer render={counter => counter} />

const App = () => (
  <Provider
    initialState={0}
    actions={{
      inc,
      dec,
      startCounting,
      stopCounting
    }}
  >
    <Button action="inc">+</Button>
    <Button action="dec">-</Button>
    <Button action="startCounting">seconds</Button>
    <Button action="stopCounting">stop</Button>
    <div>
      <Counter />
    </div>
  </Provider>
)

render(<App />, document.body)
