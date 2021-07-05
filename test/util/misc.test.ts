import { divideClues, mergeClues } from '../../src/util/misc';

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

    it('respects black squares when assigning clues', () => {
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

  describe('mergeClues', () => {
    it('merges a list of across and down clues in PUZ format order', () => {
      const puzzle = {
        width: 3,
        solution: 'ABCDEFGHI',
      };
      const across = ['1 across', '4 across', '5 across'];
      const down = ['1 down', '2 down', '3 down'];

      expect(mergeClues(puzzle, across, down)).toEqual([
        '1 across',
        '1 down',
        '2 down',
        '3 down',
        '4 across',
        '5 across',
      ]);
    });

    it('reverses the behaviour of divideClues', () => {
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

      const { across, down } = divideClues(puzzle);
      expect(mergeClues(puzzle, across, down)).toEqual(puzzle.clues);
    });
  });
});
