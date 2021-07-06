import invariant from 'ts-invariant';

import { Puzzle, SquareMarkup } from '../';
import { checksum } from './checksum';
import {
  DEFAULT_FILE_VERSION,
  ENCODING,
  EXTENSION,
  FILE_SIGNATURE,
  HEADER_OFFSET,
  NULL_BYTE,
  REGEX_BLACK_SQUARE,
  REGEX_REBUS_TABLE_STRING,
  REGEX_VERSION_STRING,
  SQUARE_MARKUP_BITMASK,
} from './constants';
import { PuzzleReader } from './PuzzleReader';

export function parseVersion(
  version: string = DEFAULT_FILE_VERSION,
): [number, number, string | undefined] {
  invariant(
    REGEX_VERSION_STRING.test(version),
    'file version data did not match expected format',
  );
  version;

  const [, majorVersion, minorVersion, patch] =
    REGEX_VERSION_STRING.exec(version)!;
  return [Number.parseInt(majorVersion), Number.parseInt(minorVersion), patch];
}

/**
 * Parse a string of key-value pairs into a JavaScript object.
 *
 * @example
 * parseRebusTable(' 0:CAT;10:DOG; 4:MOUSE;')
 *   => {0: "CAT", 10: "DOG", 4: "MOUSE"}
 * @param tableString String should be semicolon terminated.
 */
export function parseRebusTable(tableString: string): {
  [key: number]: string;
} {
  invariant(
    REGEX_REBUS_TABLE_STRING.test(tableString),
    `Rebus table text doesn't match expected format.`,
  );

  return tableString
    .slice(0, -1) // drop trailing semicolon
    .split(';')
    .map((entryString) => entryString.split(':'))
    .reduce(
      (acc, [key, value]) => ({ ...acc, [Number.parseInt(key)]: value }),
      {},
    );
}

/**
 * Print an object of key-value pairs as a semocolon-delimited string.
 *
 * @example
 * printRebusTable({0: "CAT", 10: "DOG", 4: "MOUSE"})
 *   => ' 0:CAT;10:DOG; 4:MOUSE;'
 *
 * @param tableObject
 * Object mapping rebus keys to expected solutions.
 * NOTE: Keys should not exceed 99.
 * @returns
 * A semicolon-delimited string. Note that there will be a trailing semicolon.
 */
export function printRebusTable(tableObject: {
  [key: number]: string | undefined;
}): string {
  return Object.entries(tableObject).reduce(
    (acc, [key, value]) => `${acc}${key.padStart(2, ' ')}:${value};`,
    '',
  );
}

/**
 * Format an input string as a null-terminated string.
 *
 * @param input Optional string to be formatted.
 * @returns If input is non-null, appends a null character to the end.
 * If no input is supplied, returns the empty string.
 */
export function zstring(input?: string): string {
  return input != null ? input + '\x00' : '';
}

export function guessFileEncodingFromVersion(
  fileVersion: string = DEFAULT_FILE_VERSION,
): ENCODING {
  const [majorVersion] = parseVersion(fileVersion);

  return majorVersion >= 2 ? ENCODING.UTF_8 : ENCODING.ISO_8859_1;
}

/**
 * Collect metadata text from a puzzle object as a single string. This is
 * useful for generating some PUZ file checksums.
 *
 * @param puzzle Puzzle object to collect strings from.
 * @returns A string with the text metadata fields concatenated.
 */
export function getMetaStrings({
  title,
  author,
  copyright,
  clues,
  notepad,
  fileVersion,
}: Puzzle): string {
  const [majorVersion, minorVersion] = parseVersion(fileVersion);

  return (
    zstring(title) +
    zstring(author) +
    zstring(copyright) +
    clues.join('') +
    // include notepad in v1.3 and above
    (majorVersion >= 1 && minorVersion >= 3 ? zstring(notepad) : '')
  );
}

/**
 * Allocate a buffer of 52 bytes and populate it with all expected data other
 * than checksums.
 *
 * @param puzzle Puzzle object to derive header for.
 * @returns Buffer of with encoded puzzle metadata.
 */
export function encodeHeaderWithoutChecksums(puzzle: Puzzle): Buffer {
  const header = Buffer.alloc(HEADER_OFFSET.HEADER_END);

  header.write(FILE_SIGNATURE, HEADER_OFFSET.FILE_SIGNATURE_START, 'ascii');
  header.write(
    puzzle.fileVersion ?? DEFAULT_FILE_VERSION,
    HEADER_OFFSET.VERSION_START,
    'ascii',
  );
  header.writeUInt16LE(
    puzzle?.misc?.unknown1 ?? 0x00,
    HEADER_OFFSET.RESERVED_1C_START,
  );
  header.writeUInt16LE(
    puzzle?.misc?.scrambledChecksum ?? 0x00,
    HEADER_OFFSET.SCRAMBLED_CHECKSUM_START,
  );
  Buffer.from(puzzle?.misc?.unknown2 ?? NULL_BYTE).copy(
    header,
    HEADER_OFFSET.RESERVED_20_START,
  );
  header.writeUInt8(puzzle.width, HEADER_OFFSET.WIDTH_START);
  header.writeUInt8(puzzle.height, HEADER_OFFSET.HEIGHT_START);
  header.writeUInt16LE(
    puzzle.clues.length,
    HEADER_OFFSET.NUMBER_OF_CLUES_START,
  );
  header.writeUInt16LE(
    puzzle?.misc?.unknown3 ?? 0x00,
    HEADER_OFFSET.UNKNOWN_BITMASK_START,
  );
  header.writeUInt16LE(
    puzzle.isScrambled ? 0x04 : 0x00,
    HEADER_OFFSET.SCRAMBLED_START,
  );

  return header;
}

/**
 * Encode an extension section to binary.
 *
 * @param title The four-letter section title.
 * @param data A byte array containing the extension data.
 * @returns The extension data encoded in a null-terminated byte array.
 */
export function encodeExtensionSection(
  title: EXTENSION,
  data: Uint8Array,
): Buffer {
  const header = Buffer.alloc(0x08);
  const dataChecksum = checksum(data);

  header.write(title, 0x00, 'ascii');
  header.writeUInt16LE(data.length, 0x04);
  header.writeUInt16LE(dataChecksum, 0x06);

  return Buffer.concat([header, data, NULL_BYTE]);
}

/**
 * Given a PuzzleReader, attempts to read an extension block from the reader's
 * currect cursor position.
 *
 * Validates the format, checksum and data length of the section, then returns
 * the section title and associated data buffer.
 *
 * see extension section format documentation:
 * https://github.com/ajhyndman/puz/blob/main/PUZ%20File%20Format.md#extra-sections
 *
 * @param reader
 * A PuzzleReader instance to attempt to read an extension section from.
 * @returns An object containing the section's 'title' and 'data'.
 */
export function parseExtensionSection(reader: PuzzleReader) {
  const title = reader.readString(0x04);
  const length = reader.readBytes(0x02)!.readUInt16LE();
  const checksum_e = reader.readBytes(0x02)!.readUInt16LE();
  const data = reader.readBytes(length)!;
  const sectionTerminator = reader.readBytes(0x01);

  invariant(
    checksum(data!) === checksum_e,
    `"${title}" section data does not match checksum"`,
  );

  invariant(
    NULL_BYTE.equals(sectionTerminator!),
    `"${title}" section is missing terminating null byte`,
  );

  return { title, data };
}

export function squareNeedsAcrossClue(
  { solution, width }: Pick<Puzzle, 'solution' | 'width'>,
  i: number,
): boolean {
  return (
    // square is not black square
    !REGEX_BLACK_SQUARE.test(solution[i]) &&
    // square is left edge or has black square to left
    (i % width === 0 || REGEX_BLACK_SQUARE.test(solution[i - 1])) &&
    // square is not right edge or has black square to right
    !(i % width === width - 1 || REGEX_BLACK_SQUARE.test(solution[i + 1]))
  );
}

export function squareNeedsDownClue(
  { solution, width }: Pick<Puzzle, 'solution' | 'width'>,
  i: number,
): boolean {
  return (
    // square is not black square
    !REGEX_BLACK_SQUARE.test(solution[i]) &&
    // square is top edge or has black square above
    (i < width || REGEX_BLACK_SQUARE.test(solution[i - width])) &&
    // square is bottom edge or has black square below
    !(
      i >= solution.length - width ||
      REGEX_BLACK_SQUARE.test(solution[i + width])
    )
  );
}

export function divideClues(
  puzzle: Pick<Puzzle, 'clues' | 'solution' | 'width'>,
): {
  across: string[];
  down: string[];
} {
  const { clues, solution } = puzzle;
  const clueQueue = clues.slice();
  const across: string[] = [];
  const down: string[] = [];

  [...solution].forEach((square, i) => {
    if (squareNeedsAcrossClue(puzzle, i)) {
      // assign across clue to square
      across.push(clueQueue.shift()!);
    }
    if (squareNeedsDownClue(puzzle, i)) {
      // assign down clue to square
      down.push(clueQueue.shift()!);
    }
  });

  return {
    across,
    down,
  };
}

export function mergeClues(
  { solution, width }: Pick<Puzzle, 'solution' | 'width'>,
  across: string[],
  down: string[],
): string[] {
  // copy inputs into new arrays to use as queue
  const acrossQueue = across.slice();
  const downQueue = down.slice();

  // collect clues in array to return
  const clues: string[] = [];

  [...solution].forEach((square, i) => {
    if (squareNeedsAcrossClue({ solution, width }, i)) {
      clues.push(acrossQueue.shift()!);
    }
    if (squareNeedsDownClue({ solution, width }, i)) {
      clues.push(downQueue.shift()!);
    }
  });

  return clues;
}

/**
 * Decode markup bits from a one-byte integer.
 *
 * @param markup Two bute integer with bits to be decoded
 * @returns An object with boolean keys describing the markup for a square.
 */
export function decodeMarkup(byte: number): SquareMarkup {
  const markupObject: SquareMarkup = {};
  if ((byte & SQUARE_MARKUP_BITMASK.CIRCLED) !== 0) markupObject.circled = true;
  if ((byte & SQUARE_MARKUP_BITMASK.INCORRECT) !== 0)
    markupObject.incorrect = true;
  if ((byte & SQUARE_MARKUP_BITMASK.PREVIOUSLY_INCORRECT) !== 0)
    markupObject.previouslyIncorrect = true;
  if ((byte & SQUARE_MARKUP_BITMASK.REVEALED) !== 0)
    markupObject.revealed = true;
  if ((byte & SQUARE_MARKUP_BITMASK.UNKNOWN_08) !== 0)
    markupObject.unknown_08 = true;
  if ((byte & SQUARE_MARKUP_BITMASK.UNKNOWN_04) !== 0)
    markupObject.unknown_04 = true;
  if ((byte & SQUARE_MARKUP_BITMASK.UNKNOWN_02) !== 0)
    markupObject.unknown_02 = true;
  if ((byte & SQUARE_MARKUP_BITMASK.UNKNOWN_01) !== 0)
    markupObject.unknown_01 = true;
  return markupObject;
}

/**
 * Encodes a markup object into a one-byte integer suitable for storing in
 * PUZ files.
 *
 * @param markup Object to be encoded
 * @returns a two byte integer with markup bits encoded
 */
export function encodeMarkup({
  circled,
  incorrect,
  previouslyIncorrect,
  revealed,
  unknown_08,
  unknown_04,
  unknown_02,
  unknown_01,
}: SquareMarkup): number {
  return (
    (circled ? SQUARE_MARKUP_BITMASK.CIRCLED : 0) +
    (incorrect ? SQUARE_MARKUP_BITMASK.INCORRECT : 0) +
    (previouslyIncorrect ? SQUARE_MARKUP_BITMASK.PREVIOUSLY_INCORRECT : 0) +
    (revealed ? SQUARE_MARKUP_BITMASK.REVEALED : 0) +
    (unknown_08 ? SQUARE_MARKUP_BITMASK.UNKNOWN_08 : 0) +
    (unknown_04 ? SQUARE_MARKUP_BITMASK.UNKNOWN_04 : 0) +
    (unknown_02 ? SQUARE_MARKUP_BITMASK.UNKNOWN_02 : 0) +
    (unknown_01 ? SQUARE_MARKUP_BITMASK.UNKNOWN_01 : 0)
  );
}
