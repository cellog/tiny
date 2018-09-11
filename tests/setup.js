const React = require("react")
const ReactDOM = require("react-dom")

function expectRenderError(element) {
  // Noop error boundary for testing.
  class TestBoundary extends React.Component {
    constructor(props) {
      super(props)
      this.state = { didError: false }
    }
    componentDidCatch(err) {
      this.setState({ didError: true })
    }
    render() {
      return this.state.didError ? null : this.props.children
    }
  }

  // Record all errors.
  let topLevelErrors = []
  function handleTopLevelError(event) {
    topLevelErrors.push(event.error.message)
    // Prevent logging
    event.preventDefault()
  }

  const div = document.createElement("div")
  window.addEventListener("error", handleTopLevelError)
  try {
    ReactDOM.render(<TestBoundary>{element}</TestBoundary>, div)
  } finally {
    window.removeEventListener("error", handleTopLevelError)
  }

  return topLevelErrors
}

expect.extend({
  toThrowInRender(element, message) {
    const topLevelErrors = expectRenderError(element)
    const pass = topLevelErrors.length === 1 && topLevelErrors[0].match(message)
    if (pass) {
      return {
        message: () => {
          return `Expected an error thrown, not matching:\n  "${message}"\nReceived an error matching:\n  "${
            topLevelErrors[0]
          }"`
        },
        pass: true
      }
    } else {
      return {
        message: () => {
          if (topLevelErrors.length > 1) {
            return `Expected 1 error thrown, matching "${message}", but ${
              topLevelErrors.length
            } errors were thrown`
          }
          if (topLevelErrors.length === 0) {
            return `Expected 1 error thrown, matching "${message}", but no errors were thrown`
          }
          return `Expected 1 error thrown matching:\n  "${message}"\nReceived an error matching:\n  "${
            topLevelErrors[0]
          }"`
        },
        pass: false
      }
    }
  }
})
