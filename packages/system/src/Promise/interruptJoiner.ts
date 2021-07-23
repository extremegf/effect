// ets_tracing: off

import type { Canceler } from "../Effect/Canceler"
import { succeedWith } from "../Effect/core"
import type { IO } from "../Effect/effect"
import type { Promise } from "./promise"
import { Pending } from "./state"

export function interruptJoiner<E, A>(joiner: (a: IO<E, A>) => void) {
  return (promise: Promise<E, A>): Canceler<unknown> =>
    succeedWith(() => {
      const state = promise.state.get

      if (state._tag === "Pending") {
        promise.state.set(new Pending(state.joiners.filter((j) => j !== joiner)))
      }
    })
}
