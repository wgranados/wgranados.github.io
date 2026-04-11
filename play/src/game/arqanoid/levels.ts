// 8 rows x 16 cols — R = red, G = green, B = blue, O = empty
// Mirrors the level1.txt / level2.txt format from the original Java game.

export const LEVELS: string[][] = [
  // Level 1 — alternating color rows
  [
    "RBRBRBRBRBRBRBRB",
    "GRGRGRGRGRGRGRGR",
    "BGBGBGBGBGBGBGBG",
    "RBRBRBRBRBRBRBRB",
    "OOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOO",
    "GRGRGRGRGRGRGRGR",
    "BGBGBGBGBGBGBGBG",
  ],
  // Level 2 — diamond pattern (each row = 16 chars)
  [
    "OOOOOOORROOOOOOO",
    "OOOOOGGRRGGOOOOO",
    "OOOBBBBRRBBBBOOO",
    "OOGGGGRRRRGGGGOO",
    "OOGGGGRRRRGGGGOO",
    "OOOBBBBRRBBBBOOO",
    "OOOOOGGRRGGOOOOO",
    "OOOOOOORROOOOOOO",
  ],
  // Level 3 — full grid
  [
    "RRRRRRRRRRRRRRRR",
    "BBBBBBBBBBBBBBBB",
    "GGGGGGGGGGGGGGGG",
    "RRRRRRRRRRRRRRRR",
    "BBBBBBBBBBBBBBBB",
    "GGGGGGGGGGGGGGGG",
    "RRRRRRRRRRRRRRRR",
    "BBBBBBBBBBBBBBBB",
  ],
];
