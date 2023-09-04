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
import { validate } from '../validate';
import { scrambleSolution, unscrambleSolution } from './scrambleC';

function extractScrambleText(puzzle: Puzzle) {
  const { height, width, solution } = puzzle;
  // Transpose the solution text so that it read's column-wise. i.e. From top
  // to bottom, then left to right.
  const columnWiseSolution = transpose(solution, height, width);
  return columnWiseSolution.replace(new RegExp(REGEX_BLACK_SQUARE, 'g'), '');
}

function injectScrambleText(puzzle: Puzzle, plainText: string): string {
  const { height, width, solution } = puzzle;
  const plainTextArray = [...plainText];
  // Transpose the solution text so that it read's column-wise. i.e. From top
  // to bottom, then left to right.
  let columnWiseSolution = transpose(solution, height, width);
  columnWiseSolution = [...columnWiseSolution]
    .map((char) => (REGEX_BLACK_SQUARE.test(char) ? char : plainTextArray.shift()))
    .join('');
  return transpose(columnWiseSolution, height, width);
}

export function scramble(puzzle: Puzzle, inputKey: string): Puzzle {
  validate(puzzle);
  invariant(!puzzle.isScrambled, 'Puzzle is already scrambled!');

  // omit black squares
  const plainText = extractScrambleText(puzzle);
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

  const scrambledText = scrambleSolution(plainText, inputKey);
  const scrambledSolution = injectScrambleText(puzzle, scrambledText);

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

  const plainText = extractScrambleText(puzzle);
  const unscrambledText = unscrambleSolution(plainText, inputKey);

  // validate checksum
  invariant(puzzle.misc.scrambledChecksum === checksum(Buffer.from(unscrambledText, 'ascii')));

  const unscrambledSolution = injectScrambleText(puzzle, unscrambledText);

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
