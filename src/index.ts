import { invariant } from 'ts-invariant';
import { checksum } from './checksum';

// supported text encodings
const enum ENCODING {
  UTF_8 = 'utf-8',
  ISO_8859_1 = 'latin1',
}

const enum HEADER_OFFSET {
  FILE_CHECKSUM_START = 0x00,
  FILE_SIGNATURE_START = 0x02,
  HEADER_CHECKSUM_START = 0x0e,
  ICHEATED_CHECKSUM_START = 0x10,
  ICHEATED_CHECKSUM_END = 0x18,
  VERSION_START = 0x18,
  VERSION_END = 0x1b,
  // RESERVED_1C_START = 0x1c,
  SCRAMBLED_CHECKSUM_START = 0x1e,
  // RESERVED_20_START = 0x20,
  WIDTH_START = 0x2c,
  HEIGHT_START = 0x2d,
  NUMBER_OF_CLUES_START = 0x2e,
  // UNKNOWN_BITMASK_START = 0x30,
  SCRAMBLED_START = 0x32,
  HEADER_END = 0x34,
}

export type Puzzle = {
  // meta
  author?: string;
  copyright?: string;
  encoding: ENCODING;
  fileVersion: string;
  height: number;
  isScrambled: boolean;
  notepad?: string;
  numberOfClues: number;
  title?: string;
  width: number;

  // grid data
  solution: string;
  state: string;

  // clues
  clues: string[];

  // misc
  preamble?: Uint8Array;
};

const ICHEATED = Buffer.from('ICHEATED', 'ascii');
const FILE_SIGNATURE = 'ACROSS&DOWN\x00';
const VERSION_REGEX = /^(\d+)\.(\d+)$/;

function parseVersion(version: string): [number, number] {
  invariant(
    VERSION_REGEX.test(version),
    'file version data did not match expected format',
  );
  version;

  const [, majorVersion, minorVersion] = VERSION_REGEX.exec(version);
  return [parseInt(majorVersion), parseInt(minorVersion)];
}

/**
 * Format an input string as a null-terminated string.
 *
 * @param input Optional string.to be formatted.
 * @returns If input is non-null, appends a null character to the end.
 * If no input is supplied, returns the empty string.
 */
function zstring(input?: string): string {
  return input != null ? input + '\x00' : '';
}

/**
 * A cursor-based readeer that provides methods useful for reading strings from
 * puzzle binary data.
 */
class StringReader {
  private buffer: Buffer;
  private encoding: ENCODING;
  private cursor: number;

  constructor(buffer: Buffer, encoding: ENCODING, cursorOffset?: number) {
    this.buffer = buffer;
    this.encoding = encoding;
    this.cursor = cursorOffset ?? 0;
  }

  read(length: number): string | undefined {
    const endOffset = this.cursor + length;
    if (length === 0) {
      return undefined;
    }
    const decodedString = this.buffer.toString(
      this.encoding,
      this.cursor,
      endOffset,
    );
    this.cursor = endOffset;
    return decodedString;
  }

  readNullTerminatedString(): string | undefined {
    const length = this.buffer.indexOf(0x0, this.cursor) - this.cursor;
    const decodedString = this.read(length);
    this.cursor += 1;
    return decodedString;
  }
}

export function parseBinaryFile(data: Uint8Array): Puzzle {
  // Transform to Buffer class for easier binary manipulation.
  let buffer = Buffer.from(data);

  // VALIDATE FILETYPE
  const signatureIndex = buffer.indexOf(FILE_SIGNATURE, 0, 'ascii');
  invariant(
    signatureIndex >= HEADER_OFFSET.FILE_SIGNATURE_START,
    'File does not appear to be an AcrossLite PUZ file',
  );

  // If file contains data before the signature, extract it and shift our buffer view.
  const fileStartOffset = signatureIndex - HEADER_OFFSET.FILE_SIGNATURE_START;
  let preamble;
  if (fileStartOffset > 0) {
    preamble = buffer.subarray(0, fileStartOffset);
    buffer = buffer.subarray(fileStartOffset);
  }

  // EXTRACT HEADER
  // try {
  const fileChecksum = buffer.readUInt16LE(HEADER_OFFSET.FILE_CHECKSUM_START);
  const headerChecksum = buffer.readUInt16LE(
    HEADER_OFFSET.HEADER_CHECKSUM_START,
  );
  const iCheatedChecksum = buffer.subarray(
    HEADER_OFFSET.ICHEATED_CHECKSUM_START,
    HEADER_OFFSET.ICHEATED_CHECKSUM_END,
  );
  const fileVersion = buffer.toString(
    'ascii',
    HEADER_OFFSET.VERSION_START,
    HEADER_OFFSET.VERSION_END,
  );
  const scrambledChecksum = buffer.readUInt16LE(
    HEADER_OFFSET.SCRAMBLED_CHECKSUM_START,
  );
  const width = buffer.readUInt8(HEADER_OFFSET.WIDTH_START);
  const height = buffer.readUInt8(HEADER_OFFSET.HEIGHT_START);
  const numberOfClues = buffer.readUInt16LE(
    HEADER_OFFSET.NUMBER_OF_CLUES_START,
  );
  const scrambledTag = buffer.readUInt16LE(HEADER_OFFSET.SCRAMBLED_START);
  // } catch (e) {
  //   // throw error indicating corrupt header data
  // }

  // READ STRINGS
  // Guess string encoding from file version..
  const [majorVersion, minorVersion] = parseVersion(fileVersion);
  const encoding = majorVersion >= 2 ? ENCODING.UTF_8 : ENCODING.ISO_8859_1;

  // Use a cursor-based reader to traverse the rest of the binary data.
  const reader = new StringReader(buffer, encoding, HEADER_OFFSET.HEADER_END);

  // read solution and state
  const gridSize = width * height;
  const solution = reader.read(gridSize);
  const state = reader.read(gridSize);

  // read meta strings
  const title = reader.readNullTerminatedString();
  const author = reader.readNullTerminatedString();
  const copyright = reader.readNullTerminatedString();

  // read clues
  let clues = [];
  for (let i = 0; i < numberOfClues; i += 1) {
    const clue = reader.readNullTerminatedString();
    clues.push(clue);
  }

  // read notepad
  const notepad = reader.readNullTerminatedString();

  // extra sections?
  // TODO: support extra data

  // VALIDATE CHECKSUMS

  // validate header checksum
  const checksum_h = checksum(
    buffer.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END),
  );
  invariant(
    checksum_h === headerChecksum,
    "Header checksum doesn't match contents.  Please check that you are reading a valid PUZ file.",
  );

  // validate file checksum
  const boardStrings = solution + state;
  const metaStrings =
    zstring(title) +
    zstring(author) +
    zstring(copyright) +
    clues.join('') +
    (majorVersion >= 1 && minorVersion >= 3 ? zstring(notepad) : '');
  const checksum_f = checksum(
    Buffer.from(boardStrings + metaStrings, encoding),
    checksum_h,
  );
  invariant(
    checksum_f === fileChecksum,
    "File checksum (1) doesn't match contents.  Please check that you are reading a valid PUZ file.",
  );

  // validate "ICHEATED" checksum
  const checksum_i1 = checksum_h;
  const checksum_i2 = checksum(Buffer.from(solution, encoding));
  const checksum_i3 = checksum(Buffer.from(state, encoding));
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
  invariant(
    iCheatedChecksum.equals(checksum_i),
    "File checksum (2) doesn't match contents.  Please check that you are reading a valid PUZ file.",
  );

  return {
    author,
    copyright,
    encoding,
    fileVersion,
    height,
    isScrambled: Boolean(scrambledTag),
    notepad,
    numberOfClues,
    title,
    width,

    solution,
    state,

    clues,

    preamble,
  };
}

export declare function printBinaryFile(puzzle: Puzzle): Uint8Array;

export declare function parseTextFile(file: string): Puzzle;

export declare function printTextFile(puzzle: Puzzle): string;
