import Provider from "./Provider.jsx";
import StateConsumer from "./StateConsumer.jsx";
import ActionConsumer from "./ActionConsumer.jsx";
import React from "react";
import { render } from "react-dom";

function inc(state) {
  return state + 1;
}

function dec(state) {
  return state - 1;
}

const Button = ({ action, children }) => (
  <ActionConsumer
    render={({ actions }) => (
      <button onClick={actions[action]}>{children}</button>
    )}
  />
);

const Counter = () => <StateConsumer render={counter => counter} />;

const App = () => (
  <Provider initialState={0} actions={{ inc, dec }}>
    <Button action="inc">+</Button>
    <Button action="dec">-</Button>
    <div>
      <Counter />
    </div>
  </Provider>
);

render(<App />, document.body);
