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
  guessFileEncodingFromVersion,
  squareNeedsAcrossClue,
  squareNeedsDownClue,
} from './util/misc';

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
  const checksum_f = checksum(
    Buffer.from(boardStrings + metaStrings, encoding),
    checksum_h,
  );

  return checksum_f;
}

export function getHeaderChecksum(puzzle: Puzzle): number {
  const header = encodeHeaderWithoutChecksums(puzzle);
  return checksum(
    header.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END),
  );
}

export function getICheatedChecksum(puzzle: Puzzle): Uint8Array {
  const encoding = guessFileEncodingFromVersion(puzzle.fileVersion);

  const header = encodeHeaderWithoutChecksums(puzzle);
  const checksum_h = checksum(
    header.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END),
  );

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
  return checksum_i;
}

export function getFileEncoding(puzzle: Puzzle): ENCODING {
  return guessFileEncodingFromVersion(puzzle.fileVersion);
}

export function gridNumbering(
  puzzle: Pick<Puzzle, 'solution' | 'width'>,
): (number | undefined)[] {
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

export function validate(puzzle: Partial<Puzzle>): puzzle is Puzzle | never {
  // TODO: Throw if puzzle file isn't valid in any way.
  const { fileVersion, height, isScrambled, width, solution, state, clues } =
    puzzle;

  // VALIDATE REQUIRED FIELDS
  invariant(height != null, 'Puzzle is missing required field: "height"');
  invariant(width != null, 'Puzzle is missing required field: "width"');
  invariant(solution != null, 'Puzzle is missing required field: "solution"');
  invariant(clues != null, 'Puzzle is missing required field: "clues"');

  // VALIDATE FILE VERSION STRING

  // VALIDATE SOLUTION SIZE
  invariant(
    solution.length === width * height,
    `Puzzle width & height suggest solution should be ${
      width * height
    } characters long. Found ${solution.length} characters instead.`,
  );

  // VALIDATE SOLUTION CONTENT

  // VALIDATE STATE SIZE
  if (state != null) {
    invariant(
      state.length === width * height,
      `Puzzle width & height suggest state should be ${
        width * height
      } characters long. Found ${state.length} characters instead.`,
    );
  }

  // VALIDATE STATE MATCHES SOLUTION

  // VALIDATE STATE CONTENT

  // VALIDATE CLUE COUNT

  // VALIDATE REBUS

  return true;
}
