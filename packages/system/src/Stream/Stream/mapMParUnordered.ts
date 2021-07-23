// ets_tracing: off

import { pipe } from "../../Function"
import type * as T from "../_internal/effect"
import { chainPar } from "./chainPar"
import type { Stream } from "./definitions"
import { fromEffect } from "./fromEffect"

/**
 * Maps over elements of the stream with the specified effectful function,
 * executing up to `n` invocations of `f` concurrently. The element order
 * is not enforced by this combinator, and elements may be reordered.
 */
export function mapMParUnordered(n: number) {
  return <O, R1, E1, O2>(f: (o: O) => T.Effect<R1, E1, O2>) =>
    <R, E>(self: Stream<R, E, O>): Stream<R & R1, E1 | E, O2> =>
      pipe(
        self,
        chainPar(n)((a) => fromEffect(f(a)))
      )
}
