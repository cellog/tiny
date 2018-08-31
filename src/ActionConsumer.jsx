import React from "react";
import { dispatchContext } from "./Provider.jsx";

export default class ActionConsumer extends React.Component {
  static defaultProps = {
    context: dispatchContext
  };

  renderChild = actions => {
    return this.props.render({ actions });
  };

  render() {
    return (
      <this.props.context.Consumer>
        {this.renderChild}
      </this.props.context.Consumer>
    );
  }
}
