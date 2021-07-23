// ets_tracing: off

import type * as C from "../../Cause"
import type * as A from "../../Collections/Immutable/Chunk"
import { pipe } from "../../Function"
import * as O from "../../Option"
import * as P from "../../Promise"
import * as Q from "../../Queue"
import * as SM from "../../Semaphore"
import * as T from "../_internal/effect"
import * as F from "../_internal/fiber"
import * as M from "../_internal/managed"
import * as Pull from "../Pull"
import * as chain from "./chain"
import { Stream } from "./definitions"
import * as forEach from "./forEach"
import { managed } from "./managed"
import * as tap from "./tap"

/**
 * Maps each element of this stream to another stream and returns the
 * non-deterministic merge of those streams, executing up to `n` inner streams
 * concurrently. Up to `outputBuffer` elements of the produced streams may be
 * buffered in memory by this operator.
 */
export function chainPar(n: number, outputBuffer = 16) {
  return <R1, E1, O, O2>(f: (o: O) => Stream<R1, E1, O2>) =>
    <R, E>(self: Stream<R, E, O>): Stream<R & R1, E | E1, O2> => {
      return new Stream(
        M.withChildren((getChildren) =>
          pipe(
            M.do,
            M.bind("out", () =>
              T.toManagedRelease_(
                Q.makeBounded<T.Effect<R1, O.Option<E | E1>, A.Chunk<O2>>>(
                  outputBuffer
                ),
                Q.shutdown
              )
            ),
            M.bind("permits", () => T.toManaged(SM.makeSemaphore(n))),
            M.bind("innerFailure", () => T.toManaged(P.make<C.Cause<E1>, never>())),
            M.tap(({ innerFailure, out, permits }) =>
              pipe(
                forEach.forEachManaged_(self, (a) =>
                  pipe(
                    T.do,
                    T.bind("latch", () => P.make<never, void>()),
                    T.let("innerStream", ({ latch }) =>
                      pipe(
                        managed(SM.withPermitManaged(permits)),
                        tap.tap((_) => P.succeed_(latch, undefined)),
                        chain.chain((_) => f(a)),
                        forEach.forEachChunk((b) =>
                          T.asUnit(Q.offer_(out, T.succeed(b)))
                        ),
                        T.foldCauseM(
                          (cause) =>
                            T.asUnit(
                              T.zipRight_(
                                Q.offer_(out, Pull.halt(cause)),
                                P.fail_(innerFailure, cause)
                              )
                            ),
                          (_) => T.unit
                        )
                      )
                    ),
                    T.tap(({ innerStream }) => T.fork(innerStream)),
                    T.tap(({ latch }) => P.await(latch)),
                    T.asUnit
                  )
                ),
                M.foldCauseM(
                  (cause) =>
                    T.toManaged(
                      T.zipRight_(
                        T.chain_(getChildren, (c) => F.interruptAll(c)),
                        T.asUnit(Q.offer_(out, Pull.halt(cause)))
                      )
                    ),
                  (_) =>
                    pipe(
                      P.await(innerFailure),
                      T.interruptible,
                      T.raceWith(
                        SM.withPermits_(T.interruptible(T.unit), permits, n),
                        (_, permitsAcquisition) =>
                          T.zipRight_(
                            T.chain_(getChildren, (c) => F.interruptAll(c)),
                            T.asUnit(F.interrupt(permitsAcquisition))
                          ),
                        (_, failureAwait) =>
                          T.zipRight_(
                            Q.offer_(out, Pull.end),
                            T.asUnit(F.interrupt(failureAwait))
                          )
                      ),
                      T.toManaged
                    )
                ),
                M.fork
              )
            ),
            M.map(({ out }) => T.flatten(Q.take(out)))
          )
        )
      )
    }
}
