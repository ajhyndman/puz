import { invariant } from 'ts-invariant';

import {
  getFileChecksum,
  getHeaderChecksum,
  getICheatedChecksum,
  validate,
} from './projections';
import { checksum } from './util/checksum';
import {
  EXTENSION,
  FILE_SIGNATURE,
  HEADER_OFFSET,
  SQUARE_MARKUP,
} from './util/constants';
import {
  encodeHeaderWithoutChecksums,
  guessFileEncodingFromVersion,
  parseRebusTable,
} from './util/misc';
import { PuzzleReader } from './util/PuzzleReader';

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

  // rebus data
  rebus?: {
    grid?: (number | undefined)[];
    solution?: { [key: number]: string };
    state?: (string | undefined)[];
  };

  markupGrid?: SQUARE_MARKUP[];

  // solution timer
  timer?: {
    secondsElapsed: number;
    isPaused: boolean;
  };

  // misc
  misc: {
    unknown1: number;
    unknown2: Uint8Array;
    unknown3: number;
    preamble?: Uint8Array;
    scrambledChecksum: number;
  };
};

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
  const encoding = guessFileEncodingFromVersion(fileVersion);

  // Use a cursor-based reader to traverse the rest of the binary data.
  const reader = new PuzzleReader(buffer, encoding, HEADER_OFFSET.HEADER_END);

  // read solution and state
  const gridSize = width * height;
  const solution = reader.readString(gridSize);
  const state = reader.readString(gridSize);

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

  const puzzle: Puzzle = {
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

  // READ EXTRA SECTIONS
  while (reader.hasBytesToRead()) {
    const title = reader.readString(0x04);
    const length = reader.readBytes(0x02).readUInt16LE();
    const checksum_e = reader.readBytes(0x02).readUInt16LE();
    const data = reader.readBytes(length);
    const sectionTerminator = reader.readBytes(0x01);

    invariant(
      data.length === length,
      `"${title}" section expected data with length ${length} but got ${data.length}`,
    );

    invariant(
      checksum(data) === checksum_e,
      `"${title}" section data does not match checksum"`,
    );

    invariant(
      Buffer.from([0x00]).equals(sectionTerminator),
      `"${title}" section is missing terminating null byte`,
    );

    switch (title) {
      case EXTENSION.MARKUP_GRID: {
        const grid = Array.from(data);
        grid.forEach((entry, i) => {
          if (entry <= 0) delete grid[i];
        });
        puzzle.markupGrid = grid;
        break;
      }
      case EXTENSION.REBUS_GRID: {
        const grid = Array.from(data).map((entry) => entry - 1);
        grid.forEach((entry, i) => {
          if (entry < 0) delete grid[i];
        });
        puzzle.rebus = {
          ...(puzzle.rebus ?? {}),
          grid,
        };
        break;
      }
      case EXTENSION.REBUS_SOLUTION: {
        const solutionString = data.toString(encoding);
        const rebusSolution = parseRebusTable(solutionString);
        puzzle.rebus = {
          ...(puzzle.rebus ?? {}),
          solution: rebusSolution,
        };
        break;
      }
      case EXTENSION.REBUS_STATE: {
        const rebusStateString = data.toString('ascii');
        let rebusState = rebusStateString.slice(0, -1).split('\x00');
        rebusState.forEach((entry, i) => {
          if (entry === '') delete rebusState[i];
        });
        puzzle.rebus = {
          ...(puzzle.rebus ?? {}),
          state: rebusState,
        };
      }
    }
  }

  // VALIDATE CHECKSUMS

  // validate scrambled checksum

  // validate header checksum
  invariant(
    getHeaderChecksum(puzzle) === headerChecksum,
    "Header contents don't match checksum.  Please check that you are reading a valid PUZ file.",
  );

  // validate file checksum
  invariant(
    getFileChecksum(puzzle) === fileChecksum,
    "File contents don't match checksum (1).  Please check that you are reading a valid PUZ file.",
  );

  // validate "ICHEATED" checksum
  invariant(
    iCheatedChecksum.equals(getICheatedChecksum(puzzle)),
    "File contents don't match checksum (2).  Please check that you are reading a valid PUZ file.",
  );

  return puzzle;
}

export function printBinaryFile(puzzle: Puzzle): Uint8Array {
  validate(puzzle);

  // Guess string encoding from file version.
  const encoding = guessFileEncodingFromVersion(puzzle.fileVersion);

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

  // generate checksuns
  const checksum_f = getFileChecksum(puzzle);
  const checksum_h = getHeaderChecksum(puzzle);
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
