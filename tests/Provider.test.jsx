import React from 'react'
import * as rtl from 'react-testing-library'
import Provider, { stateContext, dispatchContext, bothContext } from '../src/Provider'
import 'jest-dom'
import 'react-testing-library/cleanup-after-each'

describe('Provider', () => {
  test('initial state', () => {
    const initial = {
      test: 'hi'
    }

    const test = rtl.render(<Provider initialState={initial}>
      <stateContext.Consumer>
        {({ test }) => {
          return (
            <div>
              <div>{test}</div>
            </div>
          )
        }}
      </stateContext.Consumer>
    </Provider>)

    expect(test.queryByText('hi')).not.toBe(null)
  })
  test('action binds', () => {
    const initial = {
      test: 'hi'
    }

    const action = jest.fn((state, something) => {
      return {
        test: something
      }
    })

    const test = rtl.render(<Provider initialState={initial} actions={{ action }}>
      <bothContext.Consumer>
        {({ state, actions }) => {
          return (
            <div>
              <button onClick={() => actions.actions.action('other')}>click</button>
              <div>{state.test}</div>
            </div>
          )
        }}
      </bothContext.Consumer>
    </Provider>)

    expect(test.queryByText('hi')).not.toBe(null)
    rtl.fireEvent.click(test.getByText('click'))
    expect(test.queryByText('other')).not.toBe(null)
    expect(action).toHaveBeenCalled()
    expect(action.mock.calls[0]).toEqual([initial, 'other'])

    rtl.fireEvent.click(test.getByText('click'))
    expect(action.mock.calls[1]).toEqual([{ test: 'other' }, 'other'])
  })
  test('updates actions', () => {
    const initial = {
      test: 'hi'
    }

    const action = jest.fn((state, something) => {
      return {
        test: something
      }
    })

    const action2 = jest.fn((state, something) => {
      return {
        test: something + '2'
      }
    })

    const get = action => (<Provider initialState={initial} actions={{ action }}>
      <bothContext.Consumer>
        {({ state, actions }) => {
          return (
            <div>
              <button onClick={() => actions.actions.action('other')}>click</button>
              <div>{state.test}</div>
            </div>
          )
        }}
      </bothContext.Consumer>
    </Provider>)

    const test = rtl.render(get(action))

    expect(test.queryByText('hi')).not.toBe(null)
    rtl.fireEvent.click(test.getByText('click'))
    expect(test.queryByText('other')).not.toBe(null)
    expect(action.mock.calls[0]).toEqual([initial, 'other'])

    test.rerender(get(action2))
    rtl.fireEvent.click(test.getByText('click'))
    expect(test.queryByText('other2')).not.toBe(null)
    expect(action2.mock.calls[0]).toEqual([{ test: 'other' }, 'other'])
  })
})