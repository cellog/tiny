import Consumer from "./Consumer"
import StateConsumer from "./StateConsumer"
import ActionConsumer from "./ActionConsumer"

import Provider from "./Provider"
import ActionProvider from "./ActionProvider"
import RestoreProvider from "./RestoreProvider"
import SubProvider from "./SubProvider"

import lift, { liftSetState } from "./lift"

import {
  mapObservedBitMapper,
  makeObjectMapper,
  makeArrayMapper
} from "./observedBitsContext"

export {
  makeObjectMapper,
  makeArrayMapper,
  mapObservedBitMapper,
  Consumer,
  StateConsumer,
  ActionConsumer,
  Provider,
  ActionProvider,
  RestoreProvider,
  SubProvider,
  lift,
  liftSetState
}
