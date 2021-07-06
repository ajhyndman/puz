import invariant from 'ts-invariant';
import { Puzzle } from '.';
import {
  REGEX_BLACK_SQUARE,
  REGEX_SOLUTION,
  REGEX_STATE,
  REGEX_VERSION_STRING,
  SquareMarkupKey,
  squareMarkupKeys,
} from './util/constants';
import { squareNeedsAcrossClue, squareNeedsDownClue } from './util/misc';

/**
 * Validate that an object describes a complete and internally consistent
 * Puzzle.
 *
 * @param puzzle The object to be validated.
 * @returns If validation succeeds, returns undefined.
 * @throws If any validation check fails, throws an InvariantError
 */
export function validate(puzzle: Partial<Puzzle>): asserts puzzle is Puzzle {
  const {
    fileVersion,
    height,
    isScrambled,
    width,
    solution,
    state,
    clues,
    markupGrid,
  } = puzzle;

  // VALIDATE REQUIRED FIELDS
  invariant(height != null, 'Puzzle is missing required field: "height"');
  invariant(width != null, 'Puzzle is missing required field: "width"');
  invariant(solution != null, 'Puzzle is missing required field: "solution"');
  invariant(clues != null, 'Puzzle is missing required field: "clues"');

  if (fileVersion != null) {
    // VALIDATE FILE VERSION STRING
    invariant(
      REGEX_VERSION_STRING.test(fileVersion),
      'FileVersion must match the supported format: #.#[#]',
    );
  }

  // VALIDATE SOLUTION SIZE
  invariant(
    solution.length === width * height,
    `Puzzle width & height suggest solution should be ${
      width * height
    } characters long. Found ${solution.length} characters instead.`,
  );

  // VALIDATE SOLUTION CONTENT
  invariant(
    REGEX_SOLUTION.test(solution),
    'Puzzle solution may only contain ., :, alphanumeric characters and the following symbols: @, #, $, %, &, +, ?',
  );

  // VALIDATE STATE SIZE
  if (state != null) {
    invariant(
      state.length === width * height,
      `Puzzle width & height suggest state should be ${
        width * height
      } characters long. Found ${state.length} characters instead.`,
    );

    // VALIDATE STATE MATCHES SOLUTION
    invariant(
      [...state].every(
        (value, i) =>
          REGEX_BLACK_SQUARE.test(value) ===
          REGEX_BLACK_SQUARE.test(solution[i]),
      ),
      'Black Squares in solution and state must match',
    );

    // VALIDATE STATE CONTENT
    invariant(
      REGEX_STATE.test(state),
      'Puzzle state may only contain -, ., :, alphanumeric characters and the following symbols: @, #, $, %, &, +, ?',
    );
  }

  // VALIDATE CLUE COUNT
  let requiredClueCount = [...solution].reduce((acc, value, i) => {
    if (squareNeedsAcrossClue({ solution, width }, i)) acc += 1;
    if (squareNeedsDownClue({ solution, width }, i)) acc += 1;
    return acc;
  }, 0);
  invariant(
    requiredClueCount === clues.length,
    `Puzzle solution expects ${requiredClueCount} clues, but found ${clues.length} clues`,
  );

  // VALIDATE MARKUP GRID
  if (markupGrid) {
    invariant(
      markupGrid.length === solution.length,
      `markupGrid should match puzzle solution in length. Expected length ${solution.length}, but got ${markupGrid.length}`,
    );

    invariant(
      markupGrid.every(
        (value) =>
          typeof value != null &&
          Object.keys(value).every((key) =>
            squareMarkupKeys.includes(key as SquareMarkupKey),
          ),
      ),
      `markupGrid contains unsupported values`,
    );
  }

  // VALIDATE REBUS

  // VALIDATE SCRAMBLING

  // TODO: Throw if puzzle file isn't valid in any way.
}
