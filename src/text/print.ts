import { Puzzle } from '..';
import { divideClues } from '../util/misc';
import { validate } from '../validate';

type LineEndingStyle = 'Windows' | 'Unix';
type Indentation = '' | '  ' | '    ' | '\t';

export function printTextFile(
  puzzle: Puzzle,
  lineEndingStyle: LineEndingStyle = 'Unix',
  indentation: Indentation = '\t',
): string {
  validate(puzzle);

  const lineEnding = lineEndingStyle === 'Windows' ? '\r\n' : '\n';

  function printLine(content?: string) {
    return `${indentation}${content ?? ''}${lineEnding}`;
  }

  let text = '';

  // PRINT SIGNATURE
  text += '<ACROSS PUZZLE V2>' + lineEnding;

  // PRINT TITLE
  text += '<TITLE>' + lineEnding;
  text += printLine(puzzle.title);

  // PRINT AUTHOR
  text += '<AUTHOR>' + lineEnding;
  text += printLine(puzzle.author);

  // PRINT COPYRIGHT
  text += '<COPYRIGHT>' + lineEnding;
  text += printLine(puzzle.copyright);

  // PRINT SIZE
  text += '<SIZE>' + lineEnding;
  text += printLine(`${puzzle.width}x${puzzle.height}`);

  // PRINT GRID
  text += '<GRID>' + lineEnding;
  const gridRows = puzzle.solution.match(
    new RegExp(`.{${puzzle.width}}`, 'g'),
  )!;
  gridRows.forEach((row) => {
    text += printLine(row);
  });

  // PRINT REBUS (Optional)

  // PRINT CLUES
  const { across, down } = divideClues(puzzle);
  text += '<ACROSS>' + lineEnding;
  across.forEach((clue) => (text += printLine(clue)));
  text += '<DOWN>' + lineEnding;
  down.forEach((clue) => (text += printLine(clue)));

  // PRINT NOTEPAD
  if (puzzle.notepad != null) {
    text += '<NOTEPAD>' + lineEnding;
    text += puzzle.notepad + lineEnding;
  }

  return text;
}
