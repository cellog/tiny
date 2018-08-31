import React from "react";
import { bothContext } from "./Provider.jsx";

export default class Consumer extends React.Component {
  static defaultProps = {
    context: bothContext
  };

  renderChild = ({ state, actions }) => {
    const props = this.props;

    if (this.props.cache) {
      if (this.props.cache) {
      }
      if (this.props.map) {
      }
    }
    return this.props.render({ state, props, actions });
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
