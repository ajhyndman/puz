/**
 * Publicly-defined projections of Puzzle objects.
 *
 * "Projections" define useful operations on Puzzle objects.  Think of these as
 * the functional equivalents to "getter" methods from object-oriented software
 * patterns.
 */
import invariant from 'ts-invariant';
import { Puzzle } from './';
import { checksum } from './util/checksum';
import { ENCODING, HEADER_OFFSET, ICHEATED } from './util/constants';
import {
  encodeHeaderWithoutChecksums,
  getMetaStrings,
  getSubstitution,
  guessFileEncodingFromVersion,
  squareNeedsAcrossClue,
  squareNeedsDownClue,
} from './util/misc';
import { validate } from './validate';

export function getFileChecksum(puzzle: Puzzle): number {
  const { fileVersion, solution } = puzzle;
  const state = getState(puzzle);
  const encoding = guessFileEncodingFromVersion(fileVersion);
  const metaStrings = getMetaStrings(puzzle);

  const headerBuffer = encodeHeaderWithoutChecksums(puzzle);

  const boardStrings = solution + state;
  const checksum_h = checksum(
    headerBuffer.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END),
  );
  const checksum_f = checksum(Buffer.from(boardStrings + metaStrings, encoding), checksum_h);

  return checksum_f;
}

export function getHeaderChecksum(puzzle: Puzzle): number {
  const header = encodeHeaderWithoutChecksums(puzzle);
  return checksum(header.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END));
}

export function getICheatedChecksum(puzzle: Puzzle): Buffer {
  const encoding = guessFileEncodingFromVersion(puzzle.fileVersion);

  const header = encodeHeaderWithoutChecksums(puzzle);
  const checksum_h = checksum(header.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END));

  const metaStrings = getMetaStrings(puzzle);
  const checksum_i1 = checksum_h;
  const checksum_i2 = checksum(Buffer.from(puzzle.solution, encoding));
  const checksum_i3 = checksum(Buffer.from(getState(puzzle), encoding));
  const checksum_i4 = checksum(Buffer.from(metaStrings, encoding));
  const checksum_i = Uint8Array.from(
    [
      // low bytes
      checksum_i1 & 0x00ff,
      checksum_i2 & 0x00ff,
      checksum_i3 & 0x00ff,
      checksum_i4 & 0x00ff,
      // high bytes
      checksum_i1 >> 8,
      checksum_i2 >> 8,
      checksum_i3 >> 8,
      checksum_i4 >> 8,
    ],
    (byte, i) => byte ^ ICHEATED[i],
  );
  return Buffer.from(checksum_i);
}

export function getFileEncoding(puzzle: Puzzle): ENCODING {
  return guessFileEncodingFromVersion(puzzle.fileVersion);
}

export function gridNumbering(puzzle: Pick<Puzzle, 'solution' | 'width'>): (number | undefined)[] {
  const { solution } = puzzle;
  let clueNumber = 0;

  return [...solution].map((square, i) => {
    if (squareNeedsAcrossClue(puzzle, i) || squareNeedsDownClue(puzzle, i)) {
      clueNumber += 1;
      return clueNumber;
    }
    return undefined;
  });
}

/**
 * Get a blank working state for a given puzzle.
 *
 * @param puzzle
 * @returns Puzzle state as a single, unbroken string.
 */
export function getBlankState(puzzle: Pick<Puzzle, 'solution'>): string {
  return puzzle.solution.replace(/[^.:]/g, '-');
}

/**
 * Get the current working state for a given puzzle.
 *
 * @param puzzle
 * @returns Puzzle state as a single, unbroken string.  Returns the equivalent blank state if state is not supplied.
 */
export function getState(puzzle: Pick<Puzzle, 'solution' | 'state'>): string {
  return puzzle.state ?? getBlankState(puzzle);
}

/**
 * Does the puzzle expect a rebus solution?
 *
 * @param puzzle A valid puzzle object.
 * @returns True if the puzzle expects a rebus substitation for any index.
 */
export function hasRebusSolution(puzzle: Puzzle): boolean {
  return puzzle.rebus?.solution != null && Object.keys(puzzle.rebus.solution).length > 0;
}

/**
 * Has the user attempted to supply a rebus solution?
 *
 * @param puzzle A valid puzzle object.
 * @returns True if the user has entered a non-empty rebus substitution.
 */
export function hasRebusState(puzzle: Puzzle): boolean {
  return puzzle.rebus?.state != null && puzzle.rebus.state.some((value) => value != null);
}

/**
 * Check whether the current puzzle is solved!
 *
 * @param puzzle
 * A complete, valid puzzle object. The puzzle should not be scrambled.
 * @param ignoreRebus
 * Set this to true to check a puzzle for correctness ignoring expected rebus
 * substitutions. This is useful when an application does not support rebus
 * user input.
 *
 * @returns If the puzzle is correct, returns true
 * @throws InvariantViolation if the puzzle is scrambled or invalid.
 */
export function isCorrect(puzzle: Puzzle, ignoreRebus: boolean = false): boolean {
  validate(puzzle);
  invariant(!puzzle.isScrambled, 'Please unscramble the puzzle before checking correctness');

  // compare Rebus state to solution
  let rebusCorrect = false;
  if (!hasRebusSolution(puzzle) && hasRebusState(puzzle)) {
    // reject if user entered a rebus and none was required
    rebusCorrect = false;
  } else if (ignoreRebus || !hasRebusSolution(puzzle)) {
    // save to skip checking solution
    rebusCorrect = true;
  } else {
    // validate that every state entry matches expected solution
    const state = puzzle.rebus?.state;
    rebusCorrect =
      state != null &&
      state.every((value, i) => {
        const substitution = getSubstitution(puzzle, i);
        return substitution != null && value === substitution;
      });
  }

  // compare simple state to solution
  const stateCorrect = puzzle.state === puzzle.solution;

  return rebusCorrect && stateCorrect;
}
