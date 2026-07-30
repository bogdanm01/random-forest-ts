/**
 * Creates a deterministic pseudo-random number generator based on the
 * Mulberry32 algorithm.
 *
 * The generator maintains an internal 32-bit state and produces a reproducible
 * sequence of floating-point values in the range `[0, 1)`. Creating multiple
 * generators with the same seed produces the same sequence of values.
 *
 * This is useful for reproducible operations such as dataset shuffling,
 * bootstrap sampling, and random feature selection during experiments.
 *
 * @param seed - Initial seed used to initialize the generator state.
 *
 * @returns A function that returns the next pseudo-random number in the
 * range `[0, 1)` each time it is called.
 *
 * @remarks
 * This generator is intended for simulations and reproducible experiments.
 * It is not cryptographically secure and should not be used for security-
 * sensitive purposes.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0; // convert to unsigned integer

  return () => {
    state += 0x6d2b79f5;

    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
