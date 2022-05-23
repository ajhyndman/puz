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
import { REGEX_BLACK_SQUARE } from '../util/constants';
import { transpose } from '../util/misc';
import { range } from '../util/range';
import { validate } from '../validate';
import { scrambleSolution, unscrambleSolution } from './scrambleC';

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

  const scrambledSolution = scrambleSolution(solution, inputKey);

  return {
    ...puzzle,

    solution: scrambledSolution,

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

  invariant(
    puzzle.misc?.scrambledChecksum,
    'This puzzle appears to be scrambled, but is missing a checksum.',
  );

  const unscrambledSolution = unscrambleSolution(puzzle.solution, inputKey);

  // TODO: validate checksum

  return {
    ...puzzle,
    solution: unscrambledSolution,
    isScrambled: false,
    misc: {
      ...puzzle.misc,
      scrambledChecksum: undefined,
    },
  };
}
