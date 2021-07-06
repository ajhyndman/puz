import { gridNumbering } from '../src/projections';

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
});
