import { Puzzle } from '../src';
import { gridNumbering, isCorrect } from '../src/projections';

const MINIMAL_PUZZLE: Puzzle = {
  height: 2,
  width: 2,
  solution: 'ABCD',
  clues: ['1A', '1D', '2D', '3A'],
};

describe('projections', () => {
  describe('gridNumbering', () => {
    it('assigns numbers to squares', () => {
      const puzzle = {
        width: 3,
        solution: 'ABCDEFGHI',
        clues: ['1 across', '1 down', '2 down', '3 down', '4 across', '5 across'],
      };

      expect(gridNumbering(puzzle)).toEqual([
        1,
        2,
        3,
        4,
        undefined,
        undefined,
        5,
        undefined,
        undefined,
      ]);
    });

    it('does not assign numbers if possible solution is only one square wide', () => {
      const puzzle = {
        width: 3,
        solution: 'A.CDEFGHI',
        clues: ['1 down', '2 down', '3 across', '4 down', '5 across'],
      };

      expect(gridNumbering(puzzle)).toEqual([
        1,
        undefined,
        2,
        3,
        4,
        undefined,
        5,
        undefined,
        undefined,
      ]);
    });
  });

  describe('isCorrect', () => {
    it('rejects empty solutions', () => {
      expect(isCorrect(MINIMAL_PUZZLE)).toBe(false);
    });

    it('correctly identifies simple solution', () => {
      expect(isCorrect({ ...MINIMAL_PUZZLE, state: '----' })).toBe(false);
      expect(isCorrect({ ...MINIMAL_PUZZLE, state: 'ABC-' })).toBe(false);
      expect(isCorrect({ ...MINIMAL_PUZZLE, state: 'ABCd' })).toBe(false);
      expect(isCorrect({ ...MINIMAL_PUZZLE, state: 'ABDC' })).toBe(false);
      expect(isCorrect({ ...MINIMAL_PUZZLE, state: 'ABCD' })).toBe(true);
    });

    it('requires rebus state if solution supplied', () => {
      expect(
        isCorrect({
          ...MINIMAL_PUZZLE,
          rebus: { solution: { 1: 'AAA' }, grid: [1, , , ,] },
          state: 'ABCD',
        }),
      ).toBe(false);

      expect(
        isCorrect({
          ...MINIMAL_PUZZLE,
          rebus: { solution: { 1: 'AAA' }, grid: [1, , , ,], state: ['AAA', , , ,] },
          state: 'ABCD',
        }),
      ).toBe(true);
    });

    it('rejects extraneous rebus state', () => {
      expect(
        isCorrect({
          ...MINIMAL_PUZZLE,
          rebus: { state: ['AAA', , , ,] },
          state: 'ABCD',
        }),
      ).toBe(false);
    });

    it('allows opting out of rebus validation', () => {
      expect(
        isCorrect(
          {
            ...MINIMAL_PUZZLE,
            rebus: { solution: { 1: 'AAA' }, grid: [1, , , ,] },
            state: 'ABCD',
          },
          true,
        ),
      ).toBe(true);
    });
  });
});
