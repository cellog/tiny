import React from 'react'
import * as rtl from 'react-testing-library'
import Provider, { stateContext, dispatchContext, bothContext } from '../src/Provider'
import 'jest-dom'
import 'react-testing-library/cleanup-after-each'

describe('Provider correctness', () => {
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
  describe('normal actions', () => {
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
  describe('asynchronous action generators', () => {
    test('async handlers', () => {
      const initial = {
        test: 'hi'
      }

      const action = jest.fn((state, something) => {
        return {
          test: something
        }
      })

      const dummyAsync = {}
      const dummyInit = {}
      const async = {
        make: jest.fn((...args) => {
          return dummyAsync
        }),
        init: jest.fn((makeReturn, actions, ...args) => {
          return dummyInit
        }),
        start: jest.fn((makeReturn, initReturn, actions, ...arg) => {
          return 5
        })
      }
      let ret

      const test = rtl.render(<Provider initialState={initial} actions={{ action }} asyncActionGenerators={{ async }}>
        <bothContext.Consumer>
          {({ state, actions }) => {
            return (
              <div>
                <button onClick={() => ret = actions.generators.async('argument', 'two')}>click</button>
              </div>
            )
          }}
        </bothContext.Consumer>
      </Provider>)

      rtl.fireEvent.click(test.getByText('click'))

      expect(ret).toBe(5)
      expect(async.make.mock.calls[0]).toEqual(['argument', 'two'])

      expect(async.init.mock.calls[0][0]).toEqual(dummyAsync)
      expect(Object.keys(async.init.mock.calls[0][1].actions)).toEqual(['liftState', 'liftActions', 'action'])
      expect(Object.keys(async.init.mock.calls[0][1].generators)).toEqual(['async'])
      expect(async.init.mock.calls[0][2]).toEqual('argument')
      expect(async.init.mock.calls[0][3]).toEqual('two')

      expect(async.start.mock.calls[0][0]).toBe(dummyAsync)
      expect(async.start.mock.calls[0][1]).toBe(dummyInit)
      expect(Object.keys(async.start.mock.calls[0][2].actions)).toEqual(['liftState', 'liftActions', 'action'])
      expect(Object.keys(async.start.mock.calls[0][2].generators)).toEqual(['async'])
      expect(async.start.mock.calls[0][3]).toEqual('argument')
      expect(async.start.mock.calls[0][4]).toEqual('two')
    })
  })
})