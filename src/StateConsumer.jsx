import React from "react";
import { stateContext } from "./Provider.jsx";

export default class StateConsumer extends React.Component {
  static defaultProps = {
    context: stateContext
  };

  renderChild = state => {
    return this.props.render(state);
  };

  render() {
    if (this.props.observedBits) {
      return (
        <this.props.context.Consumer
          unstable_observedBits={this.props.observedBits}
        >
          {this.renderChild}
        </this.props.context.Consumer>
      );
    }
    return (
      <this.props.context.Consumer>
        {this.renderChild}
      </this.props.context.Consumer>
    );
  }
}
