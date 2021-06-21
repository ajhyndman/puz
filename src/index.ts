import { invariant } from 'ts-invariant';

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
  ICHEATED_CHECKSUM_END = 0x17,
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
  HEADER_END = 0x33,
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

const FILE_SIGNATURE = 'ACROSS&DOWN\x00';
const VERSION_REGEX = /^(\d+)\.(\d+)$/;

function getVersionTuple(version: string): [number, number] {
  invariant(
    VERSION_REGEX.test(version),
    'file version data did not match expected format',
  );
  version;

  const [, majorVersion, minorVersion] = VERSION_REGEX.exec(version);
  return [parseInt(majorVersion), parseInt(minorVersion)];
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

  // validate filetype
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

  // } catch (e) {
  //   // throw error indicating file is not an Across Lite Puzzle
  // }

  // extract header
  // try {
  const header = {
    fileChecksum: buffer.readUInt16LE(HEADER_OFFSET.FILE_CHECKSUM_START),
    headerChecksum: buffer.readUInt16LE(HEADER_OFFSET.HEADER_CHECKSUM_START),
    iCheatedChecksum: buffer.subarray(
      HEADER_OFFSET.ICHEATED_CHECKSUM_START,
      HEADER_OFFSET.ICHEATED_CHECKSUM_END,
    ),
    version: buffer.toString(
      'ascii',
      HEADER_OFFSET.VERSION_START,
      HEADER_OFFSET.VERSION_END,
    ),
    scrambledChecksum: buffer.readUInt16LE(
      HEADER_OFFSET.SCRAMBLED_CHECKSUM_START,
    ),
    width: buffer.readUInt8(HEADER_OFFSET.WIDTH_START),
    height: buffer.readUInt8(HEADER_OFFSET.HEIGHT_START),
    numberOfClues: buffer.readUInt16LE(HEADER_OFFSET.NUMBER_OF_CLUES_START),
    scrambledTag: buffer.readUInt16LE(HEADER_OFFSET.SCRAMBLED_START),
  };
  // } catch (e) {
  //   // throw error indicating corrupt header data
  // }

  // validate checksums
  // TODO: Validate all checksums

  // get version & encoding
  const [majorVersion] = getVersionTuple(header.version);
  const encoding = majorVersion >= 2 ? ENCODING.UTF_8 : ENCODING.ISO_8859_1;

  // Read null-terminated strings from the remainder of the file.
  // let cursorOffset = HEADER_OFFSET.HEADER_END + 1;
  const reader = new StringReader(
    buffer,
    encoding,
    HEADER_OFFSET.HEADER_END + 1,
  );

  // read solution and state
  const gridSize = header.width * header.height;
  const solution = reader.read(gridSize);
  const state = reader.read(gridSize);

  // read meta strings
  const title = reader.readNullTerminatedString();

  const author = reader.readNullTerminatedString();

  const copyright = reader.readNullTerminatedString();

  // read clues
  let clues = [];
  for (let i = 0; i < header.numberOfClues; i += 1) {
    const clue = reader.readNullTerminatedString();
    clues.push(clue);
  }

  // read notepad
  const notepad = reader.readNullTerminatedString();

  // extra sections?
  // TODO: support extra data

  return {
    author,
    copyright,
    encoding,
    fileVersion: header.version,
    height: header.height,
    isScrambled: Boolean(header.scrambledTag),
    notepad,
    numberOfClues: header.numberOfClues,
    title,
    width: header.width,

    solution,
    state,

    clues,

    preamble,
  };
}

export declare function printBinaryFile(puzzle: Puzzle): Uint8Array;

export declare function parseTextFile(file: string): Puzzle;

export declare function printTextFile(puzzle: Puzzle): string;
