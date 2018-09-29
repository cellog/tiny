const history = {
  make: (server, options) => {
    if (server) {
      return createMemoryHistory(options)
    } else {
      return createBrowserHistory(options)
    }
  },
  init: (makeHistory, actions) => ({ history: makeHistory(), actions }),
  start: ({ history, actions }) => {
    actions.setHistory(history)
    return history.listen((location) => {
      actions.locationChange(location)
    })
  },
}