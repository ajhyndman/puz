import type { Puzzle, SquareMarkup } from '../../src';
import { printBinaryFile } from '../../src/binary/print';

const MINIMAL_PUZZLE: Puzzle = {
  height: 4,
  width: 4,
  solution: 'ABCDEFGHIJKLMNOP',
  clues: ['1A', '1D', '2D', '3D', '4D', '5A', '6A', '7A'],
  isScrambled: false,
  misc: {
    scrambledChecksum: undefined,
  },
};

describe('printBinaryFile', () => {
  it('prints a simple puzzle', () => {
    expect(() => printBinaryFile(MINIMAL_PUZZLE)).not.toThrow();
  });

  it('prints a puzzle with a sparse markupGrid', () => {
    const markupGrid: SquareMarkup[] = [];
    markupGrid.length = MINIMAL_PUZZLE.solution.length;
    markupGrid[4] = { penciled: true };

    expect(() => printBinaryFile({ ...MINIMAL_PUZZLE, markupGrid })).not.toThrow();
  });
});
