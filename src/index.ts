import { SQUARE_MARKUP } from './util/constants';

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

export { parseBinaryFile } from './binary/parse';
export { printBinaryFile } from './binary/print';

export declare function parseTextFile(file: string): Puzzle;

export declare function printTextFile(puzzle: Puzzle): string;
