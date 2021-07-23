// ets_tracing: off

import { fail as effectFail } from "../Effect/fail"
import { completeWith } from "./completeWith"
import type { Promise } from "./promise"

/**
 * Fails the promise with the specified error, which will be propagated to all
 * fibers waiting on the value of the promise.
 */
export function fail_<E, A>(promise: Promise<E, A>, e: E) {
  return completeWith<E, A>(effectFail(e))(promise)
}

/**
 * Fails the promise with the specified error, which will be propagated to all
 * fibers waiting on the value of the promise.
 */
export function fail<E>(e: E) {
  return <A>(promise: Promise<E, A>) => fail_(promise, e)
}
