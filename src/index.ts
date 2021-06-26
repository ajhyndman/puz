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
  FILE_SIGNATURE_END = 0x0e,
  HEADER_CHECKSUM_START = 0x0e,
  HEADER_END = 0x34,
  ICHEATED_CHECKSUM_START = 0x10,
  ICHEATED_CHECKSUM_END = 0x18,
  VERSION_START = 0x18,
  VERSION_END = 0x1b,
  RESERVED_1C_START = 0x1c,
  SCRAMBLED_CHECKSUM_START = 0x1e,
  RESERVED_20_START = 0x20,
  RESERVED_20_END = 0x1e,
  WIDTH_START = 0x2c,
  HEIGHT_START = 0x2d,
  NUMBER_OF_CLUES_START = 0x2e,
  UNKNOWN_BITMASK_START = 0x30,
  SCRAMBLED_START = 0x32,
}

export type Puzzle = {
  // meta
  author?: string;
  copyright?: string;
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
  misc: {
    unknown1: number;
    unknown2: Uint8Array;
    unknown3: number;
    preamble?: Uint8Array;
    scrambledChecksum: number;
  };
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
  return [Number.parseInt(majorVersion), Number.parseInt(minorVersion)];
}

/**
 * Format an input string as a null-terminated string.
 *
 * @param input Optional string to be formatted.
 * @returns If input is non-null, appends a null character to the end.
 * If no input is supplied, returns the empty string.
 */
function zstring(input?: string): string {
  return input != null ? input + '\x00' : '';
}

function getFileEncoding(fileVersion: string): ENCODING {
  const [majorVersion] = parseVersion(fileVersion);

  return majorVersion >= 2 ? ENCODING.UTF_8 : ENCODING.ISO_8859_1;
}

function getMetaStrings({
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

function getFileChecksum(puzzle: Puzzle): number {
  const { fileVersion, solution, state } = puzzle;
  const encoding = getFileEncoding(fileVersion);
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

function getICheatedChecksum(puzzle: Puzzle) {
  const encoding = getFileEncoding(puzzle.fileVersion);

  const header = encodeHeaderWithoutChecksums(puzzle);
  const checksum_h = checksum(
    header.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END),
  );

  const metaStrings = getMetaStrings(puzzle);
  const checksum_i1 = checksum_h;
  const checksum_i2 = checksum(Buffer.from(puzzle.solution, encoding));
  const checksum_i3 = checksum(Buffer.from(puzzle.state, encoding));
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

function encodeHeaderWithoutChecksums(puzzle): Buffer {
  const header = Buffer.alloc(HEADER_OFFSET.HEADER_END);

  header.fill(
    FILE_SIGNATURE,
    HEADER_OFFSET.FILE_SIGNATURE_START,
    HEADER_OFFSET.FILE_SIGNATURE_END,
    'ascii',
  );
  header.fill(
    puzzle.fileVersion,
    HEADER_OFFSET.VERSION_START,
    HEADER_OFFSET.VERSION_END,
    'ascii',
  );
  header.writeUInt16LE(puzzle.misc.unknown1, HEADER_OFFSET.RESERVED_1C_START);
  header.writeUInt16LE(
    puzzle.misc.scrambledChecksum,
    HEADER_OFFSET.SCRAMBLED_CHECKSUM_START,
  );
  header.fill(
    puzzle.misc.unknown2,
    HEADER_OFFSET.RESERVED_20_START,
    HEADER_OFFSET.RESERVED_20_END,
  );
  header.writeUInt8(puzzle.width, HEADER_OFFSET.WIDTH_START);
  header.writeUInt8(puzzle.height, HEADER_OFFSET.HEIGHT_START);
  header.writeUInt16LE(
    puzzle.numberOfClues,
    HEADER_OFFSET.NUMBER_OF_CLUES_START,
  );
  header.writeUInt16LE(
    puzzle.misc.unknown3,
    HEADER_OFFSET.UNKNOWN_BITMASK_START,
  );
  header.writeUInt16LE(
    puzzle.isScrambled ? 0x04 : 0x00,
    HEADER_OFFSET.SCRAMBLED_START,
  );

  return header;
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
  const unknown1 = buffer.readUInt16LE(HEADER_OFFSET.RESERVED_1C_START);
  const scrambledChecksum = buffer.readUInt16LE(
    HEADER_OFFSET.SCRAMBLED_CHECKSUM_START,
  );
  const unknown2 = buffer.subarray(
    HEADER_OFFSET.RESERVED_20_START,
    HEADER_OFFSET.RESERVED_20_END,
  );
  const width = buffer.readUInt8(HEADER_OFFSET.WIDTH_START);
  const height = buffer.readUInt8(HEADER_OFFSET.HEIGHT_START);
  const numberOfClues = buffer.readUInt16LE(
    HEADER_OFFSET.NUMBER_OF_CLUES_START,
  );
  const unknown3 = buffer.readUInt16LE(HEADER_OFFSET.UNKNOWN_BITMASK_START);
  const scrambledTag = buffer.readUInt16LE(HEADER_OFFSET.SCRAMBLED_START);
  // } catch (e) {
  //   // throw error indicating corrupt header data
  // }

  // READ STRINGS
  // Guess string encoding from file version.
  const encoding = getFileEncoding(fileVersion);

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

  const puzzle = {
    author,
    copyright,
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

    misc: {
      unknown1,
      unknown2,
      unknown3,
      preamble,
      scrambledChecksum,
    },
  };

  // VALIDATE CHECKSUMS

  // validate scrambled checksum

  // validate header checksum
  const checksum_h = checksum(
    buffer.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END),
  );
  invariant(
    checksum_h === headerChecksum,
    "Header checksum doesn't match contents.  Please check that you are reading a valid PUZ file.",
  );

  // validate file checksum
  invariant(
    getFileChecksum(puzzle) === fileChecksum,
    "File checksum (1) doesn't match contents.  Please check that you are reading a valid PUZ file.",
  );

  // validate "ICHEATED" checksum
  invariant(
    iCheatedChecksum.equals(getICheatedChecksum(puzzle)),
    "File checksum (2) doesn't match contents.  Please check that you are reading a valid PUZ file.",
  );

  return puzzle;
}

export function printBinaryFile(puzzle: Puzzle): Uint8Array {
  // Guess string encoding from file version.
  const encoding = getFileEncoding(puzzle.fileVersion);

  // ENCODE STRINGS
  // format solution and state
  const boardText = puzzle.solution + puzzle.state;

  // format meta strings
  const metaText = `${puzzle.title ?? ''}\x00${puzzle.author ?? ''}\x00${
    puzzle.copyright ?? ''
  }\x00`;

  // format clues
  const cluesText = puzzle.clues.join('\x00') + '\x00';

  // format notepad text
  const notepadText = `${puzzle.notepad ?? ''}\x00`;

  // encode formatted strings
  const strings = Buffer.from(
    boardText + metaText + cluesText + notepadText,
    encoding,
  );

  // WRITE EXTRAS

  // ENCODE HEADER
  const header = encodeHeaderWithoutChecksums(puzzle);

  // GENERATE CHECKSUMS
  const checksum_f = getFileChecksum(puzzle);
  const checksum_h = checksum(
    header.subarray(HEADER_OFFSET.WIDTH_START, HEADER_OFFSET.HEADER_END),
  );
  const checksum_i = getICheatedChecksum(puzzle);

  // write checksums
  header.writeUInt16LE(checksum_f, HEADER_OFFSET.FILE_CHECKSUM_START);
  header.writeUInt16LE(checksum_h, HEADER_OFFSET.HEADER_CHECKSUM_START);
  header.fill(
    checksum_i,
    HEADER_OFFSET.ICHEATED_CHECKSUM_START,
    HEADER_OFFSET.ICHEATED_CHECKSUM_END,
  );

  // FORMAT FILE
  return Buffer.concat([
    puzzle.misc.preamble ?? Uint8Array.from([]),
    header,
    strings,
  ]);
}

export declare function parseTextFile(file: string): Puzzle;

export declare function printTextFile(puzzle: Puzzle): string;
