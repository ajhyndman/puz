import { Puzzle } from '../';
import {
  getFileChecksum,
  getHeaderChecksum,
  getICheatedChecksum,
  getState,
} from '../projections';
import { EMPTY_BUFFER, EXTENSION, HEADER_OFFSET } from '../util/constants';
import {
  encodeExtensionSection,
  encodeHeaderWithoutChecksums,
  guessFileEncodingFromVersion,
  printRebusTable,
} from '../util/misc';
import { validate } from '../validate';

export function printBinaryFile(puzzle: Puzzle): Uint8Array {
  validate(puzzle);

  // Guess string encoding from file version.
  const encoding = guessFileEncodingFromVersion(puzzle.fileVersion);

  // ENCODE STRINGS
  // ==============

  // format solution and state
  const boardText = puzzle.solution + getState(puzzle);

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

  // ENCODE HEADER
  // =============

  const header = encodeHeaderWithoutChecksums(puzzle);

  // generate checksuns
  const checksum_f = getFileChecksum(puzzle);
  const checksum_h = getHeaderChecksum(puzzle);
  const checksum_i = getICheatedChecksum(puzzle);

  // write checksums
  header.writeUInt16LE(checksum_f, HEADER_OFFSET.FILE_CHECKSUM_START);
  header.writeUInt16LE(checksum_h, HEADER_OFFSET.HEADER_CHECKSUM_START);
  Buffer.from(checksum_i).copy(header, HEADER_OFFSET.ICHEATED_CHECKSUM_START);

  // ENCODE EXTENSION SECTIONS
  // ========================

  let rebusGrid = EMPTY_BUFFER;
  let rebusSolution = EMPTY_BUFFER;
  let rebusState = EMPTY_BUFFER;
  if (puzzle.rebus) {
    if (puzzle.rebus.grid) {
      const data = Uint8Array.from(puzzle.rebus.grid, (value) =>
        value == null ? 0x00 : value + 1,
      );
      rebusGrid = encodeExtensionSection(EXTENSION.REBUS_GRID, data);
    }
    if (puzzle.rebus.solution) {
      const data = Buffer.from(printRebusTable(puzzle.rebus.solution), 'ascii');
      rebusSolution = encodeExtensionSection(EXTENSION.REBUS_SOLUTION, data);
    }
    if (puzzle.rebus.state) {
      const stateString =
        puzzle.rebus.state
          .map((value) => (value == null ? '' : value))
          .join('\x00') + '\x00';
      const data = Buffer.from(stateString, 'ascii');
      rebusState = encodeExtensionSection(EXTENSION.REBUS_STATE, data);
    }
  }

  let timer = EMPTY_BUFFER;
  if (puzzle.timer != null) {
    const data = Buffer.from(
      `${puzzle.timer.secondsElapsed},${puzzle.timer.isPaused ? 1 : 0}`,
      'ascii',
    );
    timer = encodeExtensionSection(EXTENSION.TIMER, data);
  }

  let markup = EMPTY_BUFFER;
  if (puzzle.markupGrid != null) {
    const data = Uint8Array.from(puzzle.markupGrid, (value) =>
      value === undefined ? 0x00 : value,
    );

    markup = encodeExtensionSection(EXTENSION.MARKUP_GRID, data);
  }

  // FORMAT FILE
  // ===========

  return Buffer.concat([
    // preserve preamble when round-tripping data
    puzzle?.misc?.preamble ?? EMPTY_BUFFER,

    // rquired puzzle definition
    header,
    strings,

    // extensions
    rebusGrid,
    rebusSolution,
    timer,
    markup,
    rebusState,
  ]);
}
