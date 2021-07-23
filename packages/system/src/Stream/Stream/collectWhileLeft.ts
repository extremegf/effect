// ets_tracing: off

import * as E from "../../Either"
import * as O from "../../Option"
import { collectWhileMap_ } from "./collectWhileMap"
import type { Stream } from "./definitions"

/**
 * Terminates the stream when encountering the first `Right`.
 */
export function collectWhileLeft<R, E, O1, L1>(
  self: Stream<R, E, E.Either<L1, O1>>
): Stream<R, E, L1> {
  return collectWhileMap_(
    self,
    E.fold(
      (a) => O.some(a),
      (_) => O.none
    )
  )
}
