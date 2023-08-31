import { invariant, InvariantError } from 'ts-invariant';
import { CHAR_CODE_A } from './constants';
import { range } from './range';

/**
 * Compress the keys used in a puzzle rebus to the smallest integer range.
 *
 * i.e. if puzzle uses sparse integer keys, like [1, 6, 240, 10020], compress
 * these to sequential integers: [0, 1, 2, 3]
 *
 * This is useful when writing a binary puzzle to text.
 *
 * NOTE: This function does not validate that the grid and solution correspond.
 *
 * @param rebusGrid A non-empty rebus grid, as specified in a Puzzle object
 * @param rebusSolution A non-empty rebus solution, as sepcified in a Puzzle object
 *
 * @returns An equivalent rebus grid and solution with normalized key values.
 */
export function compressKeys(
  rebusGrid: (number | undefined)[],
  rebusSolution: { [key: number]: string },
) {
  const suppliedKeys = Object.keys(rebusSolution)
    .map((key) => Number.parseInt(key))
    .sort((a, b) => a - b);
  const nextKeys = range(0, suppliedKeys.length);

  // if keys are already sequential, we're done!
  if (nextKeys.every((value, i) => value === suppliedKeys[i])) {
    return { rebusGrid, rebusSolution };
  }

  function getNextKey(suppliedKey?: number) {
    return suppliedKey && nextKeys[suppliedKeys.indexOf(suppliedKey)];
  }

  // map old keys to new keys in grid
  // const nextGrid = new Array(rebusGrid.length)
  const nextGrid = rebusGrid.map((key) => getNextKey(key));
  // map old keys to new keys in solution
  const nextSolution: { [key: number]: string } = Object.fromEntries(
    Object.entries(rebusSolution).map(([key, substitution]) => [
      getNextKey(Number.parseInt(key)),
      substitution,
    ]),
  );
  return { rebusGrid: nextGrid, rebusSolution: nextSolution };
}

export function rebusKeyCharToNum(char: string): number {
  let num;

  if (char === '0') {
    num = 10;
  } else if (/^[0-9]$/.test(char)) {
    num = Number.parseInt(char);
  } else if (/^[@#$%&+?]$/.test(char)) {
    num = { '@': 11, '#': 12, $: 13, '%': 14, '&': 15, '+': 16, '?': 17 }[char]!;
  } else if (/^[A-Z]$/.test(char)) {
    const offset = 10 + 7;
    num = offset + char.charCodeAt(0) - CHAR_CODE_A + 1;
  } else if (/^[a-z]$/.test(char)) {
    const offset = 10 + 7 + 26;
    num = offset + char.charCodeAt(0) - CHAR_CODE_A + 1;
  }

  invariant(num != null, `encodeRebusKey: Encountered an invalid character "${char}"`);

  // shift numeric key by 1 to support 0 index
  return num - 1;
}

export function rebusKeyNumToChar(num: number): string {
  // shift numeric key by 1 to support 0 index
  num += 1;

  if (1 <= num && num <= 9) {
    return num.toString();
  }
  if (num === 10) {
    return '0';
  }
  if (11 <= num && num <= 17) {
    return { 11: '@', 12: '#', 13: '$', 14: '%', 15: '&', 16: '+', 17: '?' }[num]!;
  }

  // TODO: support encoding as characters that are not already in use in puzzle

  throw new InvariantError(`encodeRebusKey: Encountered an unsupported rebus key "${num}"`);
}
