import { invariant } from 'ts-invariant';

import { Puzzle } from '..';
import { getFileChecksum, getHeaderChecksum, getICheatedChecksum } from '../projections';
import { EXTENSION, FILE_SIGNATURE, HEADER_OFFSET, REGEX_TIMER_STRING } from '../util/constants';
import {
  decodeMarkup,
  guessFileEncodingFromVersion,
  parseExtensionSection,
  parseRebusTable,
} from '../util/misc';
import { PuzzleReader } from '../util/PuzzleReader';

export function parseBinaryFile(data: Uint8Array): Puzzle {
  // Transform to Buffer class for easier binary manipulation.
  let buffer = Buffer.from(data);

  // VALIDATE FILETYPE
  // =================

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
  // ==============

  // try {
  const fileChecksum = buffer.readUInt16LE(HEADER_OFFSET.FILE_CHECKSUM_START);
  const headerChecksum = buffer.readUInt16LE(HEADER_OFFSET.HEADER_CHECKSUM_START);
  const iCheatedChecksum = buffer.subarray(
    HEADER_OFFSET.ICHEATED_CHECKSUM_START,
    HEADER_OFFSET.ICHEATED_CHECKSUM_END,
  );
  const fileVersion = buffer
    .toString('ascii', HEADER_OFFSET.VERSION_START, HEADER_OFFSET.VERSION_END)
    .replace(/\x00/g, '');
  const unknown1 = buffer.readUInt16LE(HEADER_OFFSET.RESERVED_1C_START);
  const scrambledChecksum = buffer.readUInt16LE(HEADER_OFFSET.SCRAMBLED_CHECKSUM_START);
  const unknown2 = buffer.subarray(HEADER_OFFSET.RESERVED_20_START, HEADER_OFFSET.RESERVED_20_END);
  const width = buffer.readUInt8(HEADER_OFFSET.WIDTH_START);
  const height = buffer.readUInt8(HEADER_OFFSET.HEIGHT_START);
  const numberOfClues = buffer.readUInt16LE(HEADER_OFFSET.NUMBER_OF_CLUES_START);
  const unknown3 = buffer.readUInt16LE(HEADER_OFFSET.UNKNOWN_BITMASK_START);
  const scrambledTag = buffer.readUInt16LE(HEADER_OFFSET.SCRAMBLED_START);
  // } catch (e) {
  //   // throw error indicating corrupt header data
  // }

  // READ STRINGS
  // ============

  // Guess string encoding from file version.
  const encoding = guessFileEncodingFromVersion(fileVersion);

  // Use a cursor-based reader to traverse the rest of the binary data.
  const reader = new PuzzleReader(buffer, encoding, HEADER_OFFSET.HEADER_END);

  // read solution and state
  const gridSize = width * height;
  const solution = reader.readString(gridSize)!;
  const state = reader.readString(gridSize)!;

  // read meta strings
  const title = reader.readNullTerminatedString();
  const author = reader.readNullTerminatedString();
  const copyright = reader.readNullTerminatedString();

  // read clues
  let clues: string[] = [];
  for (let i = 0; i < numberOfClues; i += 1) {
    const clue = reader.readNullTerminatedString();
    invariant(clue != null, `Failed to read clue from puzzle file`);
    clues.push(clue);
  }

  // read notepad
  const notepad = reader.readNullTerminatedString();

  // READ EXTENSION SECTIONS
  // =======================

  let markupGrid: Puzzle['markupGrid'];
  let rebus: Puzzle['rebus'];
  let timer: Puzzle['timer'];

  while (reader.hasBytesToRead()) {
    const { title, data } = parseExtensionSection(reader);

    switch (title) {
      case EXTENSION.MARKUP_GRID: {
        const grid = Array.from(data);
        // grid.forEach((entry, i) => {
        //   if (entry <= 0) delete grid[i];
        // });
        markupGrid = grid.map((markup) => decodeMarkup(markup));
        break;
      }
      case EXTENSION.REBUS_GRID: {
        // In the rebus data, null bytes are used to indicate squares with no
        // rebus.  All values are shifted up by one when encoded to avoid
        // collisions with the null empty byte.
        const grid = Array.from(data).map((entry) => entry - 1);
        // Improve clarity for library consumers by deleting "empty" null markers
        grid.forEach((entry, i) => {
          if (entry < 0) delete grid[i];
        });
        rebus = { ...(rebus ?? {}), grid };
        break;
      }
      case EXTENSION.REBUS_SOLUTION: {
        const solutionString = data.toString('ascii');
        const rebusSolution = parseRebusTable(solutionString);
        rebus = { ...(rebus ?? {}), solution: rebusSolution };
        break;
      }
      case EXTENSION.REBUS_STATE: {
        const rebusStateString = data.toString('ascii');
        // encoded rebus state is null-delimited with a trailing null byte
        let rebusState = rebusStateString.slice(0, -1).split('\x00');
        // Improve clarity for library consumers by deleting "empty" null markers
        rebusState.forEach((entry, i) => {
          if (entry === '') delete rebusState[i];
        });
        rebus = { ...(rebus ?? {}), state: rebusState };
        break;
      }
      case EXTENSION.TIMER: {
        const timerString = data.toString('ascii');
        invariant(
          REGEX_TIMER_STRING.test(timerString),
          "Timer data doesn't match expected format.",
        );
        const [, secondsElapsed, isPaused] = REGEX_TIMER_STRING.exec(timerString)!;
        timer = {
          secondsElapsed: Number.parseInt(secondsElapsed),
          isPaused: isPaused === '1',
        };
        break;
      }
      default:
        console.warn('Unrecognized extension section:', title);
    }
  }

  const puzzle: Puzzle = {
    author,
    copyright,
    fileVersion,
    height,
    isScrambled: Boolean(scrambledTag),
    notepad,
    title,
    width,

    solution: solution,
    state: state,

    clues,

    rebus,
    markupGrid,
    timer,

    misc: {
      unknown1,
      unknown2,
      unknown3,
      preamble,
      scrambledChecksum,
    },
  };

  // VALIDATE CHECKSUMS
  // ==================

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
