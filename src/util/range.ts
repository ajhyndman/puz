/**
 * Simple range function.
 *
 * @returns a list containing integers from start (inclusive) to end (exclusive).
 */
export function range(start: number, end: number) {
  const list = [];

  let i = start;
  while (i < end) {
    list.push(i);
    i += 1;
  }
  return list;
}
