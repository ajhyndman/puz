import { scramble } from './scramble/scramble';
import { SquareMarkupKey } from './util/constants';

export type SquareMarkup = {
  [key in SquareMarkupKey]?: boolean;
};

export type Puzzle = {
  // meta
  author?: string;
  copyright?: string;
  fileVersion?: string;
  height: number;
  isScrambled?: boolean;
  notepad?: string;
  title?: string;
  width: number;

  // grid data
  solution: string;
  state?: string;

  // clues
  clues: string[];

  // extension data
  markupGrid?: SquareMarkup[];
  rebus?: {
    grid?: (number | undefined)[];
    solution?: { [key: number]: string };
    state?: (string | undefined)[];
  };
  timer?: {
    secondsElapsed: number;
    isPaused: boolean;
  };

  // misc
  misc?: {
    unknown1?: number;
    unknown2?: Uint8Array;
    unknown3?: number;
    preamble?: Uint8Array;
    scrambledChecksum?: number;
  };
};

export { parseBinaryFile } from './binary/parse';
export { printBinaryFile } from './binary/print';

export { parseTextFile } from './text/parse';
export { printTextFile } from './text/print';

export { validate } from './validate';

export { scramble, unscramble } from './scramble/scramble';

export * from './projections';
