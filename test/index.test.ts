import { readFileSync } from 'fs';
import { join } from 'path';

import { parseBinaryFile, printBinaryFile } from '../src/index';

describe('puz', () => {
  const puzzleFiles = [
    './puzzles/av110622.puz',
    './puzzles/cs080904.puz',
    './puzzles/washpost.puz',
  ].map((path) => readFileSync(join(__dirname, path)));

  it.skip('parses binary puzzles without crashing', () => {
    puzzleFiles.forEach((buffer) => {
      parseBinaryFile(buffer);
    });
  });

  it.skip('parses and prints binary files preserving exact bytes', () => {
    puzzleFiles.forEach((buffer) => {
      const puzzle = parseBinaryFile(buffer);
      expect(printBinaryFile(puzzle)).toEqual(buffer);
    });
  });

  it('extracts binary data into a Puzzle Object', () => {
    const puzzle = parseBinaryFile(puzzleFiles[0]);

    expect(puzzle.author).toBe('Ben Tausig');
    expect(puzzle.copyright).toBe(undefined);
    expect(puzzle.encoding).toBe('latin1');
    expect(puzzle.fileVersion).toBe('1.2');
    expect(puzzle.height).toBe(15);
    expect(puzzle.isScrambled).toBe(false);
    expect(puzzle.notepad).toBe(undefined);
    expect(puzzle.numberOfClues).toBe(78);
    expect(puzzle.title).toBe('AV Club xword, 6 22 11');
    expect(puzzle.width).toBe(15);

    expect(puzzle.solution).toBe(
      'SATAN.TROI.LAMETRINA.RUNS.IHOPEMMET.ESCAPEHATTHEWICKEDWIT...TOM.OHS...KOTEXELAINE.MLLE.HEXDECCA.PLEA.VINO..HELLSKITTEN..QUIT.BAJA.RIGGSBAN.USSR.DENALISWEAT...EON.MUG...PITTINGCOACHBITPLEASE.HOJOSORAL.TRAM.ELISASKYE.SONY.SAGET',
    );
    expect(puzzle.state).toBe(
      '-----.----.---------.----.---------.---------------------...---.---...-----------.----.--------.----.----..-----------..----.----.--------.----.-----------...---.---...---------------------.---------.----.---------.----.-----',
    );

    expect(puzzle.clues).toEqual([
      'Fallen angel',
      'Let stand, in editing',
      'Top opening',
      'Conveyance for Marty McFly',
      'From the top',
      'Like some holidays',
      'Commander Deanna on "Star Trek: The Next Generation"',
      'Cannondale alternatives',
      "It's a trick",
      'One way to store data',
      '"___ the best minds of my generation ..."',
      'Palinesque prefix before "stream"',
      'Deceive',
      '"That feels amazing ..."',
      'Minnesota shopping mecca, for short',
      'Brand with blue and pink test results',
      'MC with "Still da Baddest"',
      'Some charity events',
      'Chain with sausage links',
      'Irish revolutionary Robert',
      'What a fugitive uses to hide his head?',
      "Seattle's ___ Place Market",
      'Nickname for a demon doing comedy?',
      'T-Shirt revolutionary',
      'Batshit Cruise',
      'Some cereal units',
      'Big name in pads',
      "Whatever-it's-called",
      "Day's end, to a poet",
      'Tic-tac-toe loser',
      "Jerry's fictional ex",
      '"Fin" Tutuola portrayer on "Law & Order: SVU"',
      'Srta. in France',
      'First president of the SCLC',
      "'70s-'80s princess",
      'Delt neighbor',
      'Bad spell',
      "Patsy Cline's record label",
      'Result of some court bargaining',
      'Non-commercial TV spots',
      'Trattoria beverage',
      "User's entry point",
      'Cute animal fawned over by murderers, whoremongers, idolaters, and liars?',
      'Mass units: Abbr.',
      'Foxholes',
      `"That's really annoying!"`,
      'Valuable fantasy football picks, for short',
      'Org. in 2008 negotiations with GM',
      'Peninsula with delicious avocados',
      `Gibson's "Lethal Weapon" role`,
      'Blood sugar',
      'Shows exasperation with',
      'Pass a law about, maybe',
      'Cold War letters',
      'Monopoly purchase: Abbr.',
      "Mount McKinley's national park",
      'Precinct animal',
      'Cool off naturally',
      'iCloud company',
      'A billion years',
      'The FBI, to the mob',
      'Face',
      'Mentor to fruit salad chefs?',
      'Cold holidays in Vietnam',
      'Root in some fake meat',
      '"This ___ outrage!"',
      "Slave dancer in Jabba the Hutt's palace",
      'Polite request to an assistant on a home improvement project?',
      'NYY rival',
      'Piss off',
      'One-time YouTube sensation Zonday',
      'Erstwhile roadside eateries, familiarly',
      'Adult subcategory',
      'Theme park transportation',
      'Actress Donovan of "Clueless"',
      '___ terrier',
      'Maker of robots',
      'Foul-mouthed comedian Bob',
    ]);
  });
});
