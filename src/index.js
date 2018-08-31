import Provider from "./Provider.jsx";
import Consumer from "./Consumer.jsx";
import React from "react";
import { render } from "react-dom";

function inc(state) {
  return state + 1;
}

function dec(state) {
  return state - 1;
}

const Button = ({ action, children }) => (
  <Consumer
    render={({ actions }) => (
      <button onClick={actions[action]}>{children}</button>
    )}
  />
);

const Counter = () => <Consumer render={({ state }) => state} />;

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
