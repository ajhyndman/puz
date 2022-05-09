/**
 * Scramble and unscramble puzzle objects.
 *
 * Algorithm originally published by Brian Raiter <breadbox@muppetlabs.com>.
 *
 * {@see http://www.muppetlabs.com/~breadbox/txt/acre.html}
 * {@see http://www.muppetlabs.com/~breadbox/txt/scramble-c.txt}
 */
import invariant from 'ts-invariant';
import { Puzzle } from '..';
import { checksum } from '../util/checksum';
import { CHAR_CODE_A, REGEX_BLACK_SQUARE, REGEX_UPPERCASE_ALPHA } from '../util/constants';
import { getCharCode, transpose } from '../util/misc';
import { range } from '../util/range';
import { validate } from '../validate';

const KEY_REGEX = /^[0-9]{4}$/;

function normalizeKey(key: string) {
  invariant(KEY_REGEX.test(key));
  return key.split('').map((a) => Number.parseInt(a)) as [number, number, number, number];
}

/**
 * Interpret a list of characters as a grid with specified number of rows.
 * Then shuffle "key" cols from the left of the grid to the right.
 *
 * @param rows
 * @param key
 * @param characters
 * @returns
 */
export function shuffle(rows: number, key: number, characters: number[]) {
  // // if rows is greater than size of puzzle, shift rows
  // let numRows = rows;
  // if (rows > characters.length) {
  //   numRows = rows - (characters.length | 1);
  // }
  invariant(
    rows <= characters.length,
    "can't shuffle solution assuming more rows than size of puzzle",
  );

  const height = Math.ceil(characters.length / rows);
  return range(0, rows * height)
    .map((i) => {
      const row = i % height;
      const prevRow = (row + key) % height;
      const col = Math.floor(i / height);
      return characters[col * height + prevRow];
    })
    .filter((a) => a != null);
}

export function scramble(puzzle: Puzzle, inputKey: string): Puzzle {
  validate(puzzle);
  invariant(!puzzle.isScrambled, 'Puzzle is already scrambled!');

  invariant(
    puzzle.solution.length >= 12,
    `Puzzle scrambling is only supported for puzzles with solutions of at least 12 characters. Found ${puzzle.solution.length} characters instead.`,
  );

  const key = normalizeKey(inputKey);

  const { height, width, solution } = puzzle;

  // Transpose the solution text so that it read's column-wise. i.e. From top
  // to bottom, then left to right.
  const columnWiseSolution = transpose(solution, height, width);

  // omit black squares
  const plainText = columnWiseSolution.replace(new RegExp(REGEX_BLACK_SQUARE, 'g'), '');
  const size = plainText.length;

  invariant(
    /^[A-Z]+$/.test(plainText),
    'Scrambling a puzzle that has non-alphabetical characters in the solution is not supported.',
  );

  invariant(
    size >= 12,
    `Scrambling is not supported for puzzles with less than 12 characters. Found ${size} characters.`,
  );

  // A puzzle's scrambled checksum is based on the column-wise grid contents,
  // ignoring black squares.
  const scrambledChecksum = checksum(Buffer.from(plainText, 'ascii'));

  const isSizeEven = size % 2 === 0;

  // Map characters to numbers from 0 to 25, inclusive.
  let characters = plainText.split('').map(getCharCode);

  // for each key digit
  key.forEach((keyDigit, k) => {
    let prev = characters.slice();

    // sequentially add key digits to contents
    prev = prev.map((value, i) => (value + key[i % 4]) % 26);

    // group in 2^(4-k) cols, and shift rows
    const width = Math.pow(2, 4 - k);
    const height = Math.ceil(size / width);
    characters = range(0, width * height)
      .map((i) => {
        const row = i % height;
        const prevRow = (row + keyDigit) % height;
        const col = Math.floor(i / height);
        return prev[col * height + prevRow];
      })
      .filter((a) => a != null);

    // TODO: if even, shift cols
  });

  // map numbers back to characters
  const scrambledCharacters = characters.map((num) => String.fromCharCode(num + CHAR_CODE_A));

  // re-insert black squares
  let scrambledText = columnWiseSolution
    .split('')
    .map((originalChar, i) => {
      if (REGEX_BLACK_SQUARE.test(originalChar)) {
        return originalChar;
      }
      return scrambledCharacters.shift();
    })
    .join('');

  // re-order solution back into rows
  scrambledText = transpose(scrambledText, width, height);

  return {
    ...puzzle,

    solution: scrambledText,

    isScrambled: true,

    misc: {
      ...puzzle.misc,
      scrambledChecksum,
    },
  };
}

export function unscramble(puzzle: Puzzle, inputKey: string): Puzzle {
  validate(puzzle);
  invariant(puzzle.isScrambled, 'Puzzle is not scrambled!');

  const key = normalizeKey(inputKey);

  // TODO: unscramble

  return puzzle;
}
