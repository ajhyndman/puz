import invariant from 'ts-invariant';

import { Puzzle } from '../';
import {
  ENCODING,
  FILE_SIGNATURE,
  HEADER_OFFSET,
  VERSION_REGEX,
} from './constants';

export function parseVersion(version: string): [number, number] {
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
export function zstring(input?: string): string {
  return input != null ? input + '\x00' : '';
}

export function getFileEncoding(fileVersion: string): ENCODING {
  const [majorVersion] = parseVersion(fileVersion);

  return majorVersion >= 2 ? ENCODING.UTF_8 : ENCODING.ISO_8859_1;
}

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

export function encodeHeaderWithoutChecksums(puzzle): Buffer {
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
