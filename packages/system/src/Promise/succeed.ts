// ets_tracing: off

import { succeed as effectSucceed } from "../Effect/core"
import { completeWith } from "./completeWith"
import type { Promise } from "./promise"

/**
 * Completes the promise with the specified value.
 */
export function succeed<A>(a: A) {
  return <E>(promise: Promise<E, A>) => completeWith<E, A>(effectSucceed(a))(promise)
}

/**
 * Completes the promise with the specified value.
 */
export function succeed_<A, E>(promise: Promise<E, A>, a: A) {
  return completeWith<E, A>(effectSucceed(a))(promise)
}
