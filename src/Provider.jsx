import React, { Component } from "react";

const dispatchContext = React.createContext();
const stateContext = React.createContext();
const bothContext = React.createContext();
export { dispatchContext, stateContext, bothContext };

export default class Provider extends Component {
  static defaultProps = {
    dispatchContext: dispatchContext,
    stateContext: stateContext,
    bothContext: bothContext,
    actions: []
  };
  constructor(props) {
    super(props);
    this.mounted = false;
    this.state = {
      state: this.props.initialState,
      actions: this.bindActions(this.props.actions),
      error: false
    };
    this.error = false;
  }

  updateState = (action, resolver, ...args) => {
    this.setState(state => {
      let ret;
      try {
        ret = action(state.state, ...args);
      } catch (error) {
        return { error };
      }
      if (ret.then instanceof Function) {
        ret
          .then(
            result =>
              this.mounted && resolver
                ? this.updateState(resolver, result)
                : result
          )
          .catch(error => this.mounted && this.setState({ error }));
        return null;
      }
      return { state: ret };
    }, this.props.monitor ? () => this.props.monitor(this.state.state) : undefined);
  };

  bindActions(actions) {
    return Object.keys(actions).reduce(
      (boundActions, action) => ({
        ...boundActions,
        [action]: (...args) => {
          this.updateState(actions[action], actions[action].resolver, ...args);
        }
      }),
      {}
    );
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentDidUpdate(lastProps) {
    if (lastProps.actions !== this.props.actions) {
      this.setState({ actions: this.bindActions(this.props.actions) });
    }
  }
  render() {
    if (this.state.error) throw this.state.error;
    const { dispatchContext, stateContext, bothContext } = this.props;
    return (
      <dispatchContext.Provider value={this.state.actions}>
        <stateContext.Provider value={this.state.state}>
          <bothContext.Provider value={this.state}>
            {this.props.children}
          </bothContext.Provider>
        </stateContext.Provider>
      </dispatchContext.Provider>
    );
  }
}
