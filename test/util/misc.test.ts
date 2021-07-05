import { divideClues } from '../../src/util/misc';

describe('util/misc', () => {
  describe('divideClues', () => {
    it('assigns clues to across and down roles', () => {
      const puzzle = {
        width: 3,
        solution: 'ABCDEFGHI',
        clues: [
          '1 across',
          '1 down',
          '2 down',
          '3 down',
          '4 across',
          '5 across',
        ],
      };

      expect(divideClues(puzzle)).toEqual({
        across: ['1 across', '4 across', '5 across'],
        down: ['1 down', '2 down', '3 down'],
      });
    });

    it('does not assign clues if possible solution is only one square wide', () => {
      const puzzle = {
        width: 3,
        solution: 'A.CDEFGHI',
        clues: ['1 down', '2 down', '3 across', '4 down', '5 across'],
      };

      expect(divideClues(puzzle)).toEqual({
        across: ['3 across', '5 across'],
        down: ['1 down', '2 down', '4 down'],
      });
    });
  });
});
