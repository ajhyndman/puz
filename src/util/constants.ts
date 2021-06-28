// supported text encodings
export enum ENCODING {
  UTF_8 = 'utf-8',
  ISO_8859_1 = 'latin1',
}

export const enum HEADER_OFFSET {
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

export enum SQUARE_MARKUP {
  DEFAULT = 0x00,
  PREVIOUSLY_INCORRECT = 0x10,
  INCORRECT = 0x20,
  REVEALED = 0x40,
  CIRCLED = 0x80,
}

export const enum EXTENSION {
  REBUS_GRID = 'GRBS',
  REBUS_SOLUTION = 'RTBL',
  REBUS_STATE = 'RUSR',
  MARKUP_GRID = 'GEXT',
}

export const ICHEATED = Buffer.from('ICHEATED', 'ascii');
export const FILE_SIGNATURE = 'ACROSS&DOWN\x00';
export const VERSION_REGEX = /^(\d+)\.(\d+)$/;