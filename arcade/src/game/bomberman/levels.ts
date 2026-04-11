// Each level is a 13-row x 15-col grid of characters:
//   B = solid (indestructible) wall
//   O = open space
//   S = snowball (destructible wall, no power-up)
//   f = snowball hiding fire power-up (blast radius +1)
//   b = snowball hiding bomb power-up (bomb count +1)
//   s = snowball hiding speed power-up (movement speed +1)
//   c = snowball hiding cool bonus (5000 points)
//
// Grid layout follows classic Bomberman:
//   - Border (row 0/12, col 0/14) is always B
//   - Interior pillars at even row + even col are B
//   - P1 spawns top-left  (1,1) with (1,2) and (2,1) open
//   - P2 spawns bot-right (11,13) with (11,12) and (10,13) open
//   - All other interior cells are destructible snowballs (or power-ups)

export const LEVELS: string[][] = [
  // Level 1 — light power-ups
  [
    "BBBBBBBBBBBBBBB",
    "BOOSSSSSSSSfSSB",
    "BOBSBSBSBSBSBSB",
    "BSSSfSSSSSSbSSB",
    "BSBSBSBSBSBSBSB",
    "BSSSSSSSSSSSSsB",
    "BSBSBSBSBSBSBSB",
    "BsSSSSSSSSSSSSB",
    "BSBSBSBSBSBSBSB",
    "BSSbSSSSSSfSSSB",
    "BSBSBSBSBSBSBOB",
    "BSSfSSSSSSSSOOB",
    "BBBBBBBBBBBBBBB",
  ],
  // Level 2 — more power-ups, cool bonuses
  [
    "BBBBBBBBBBBBBBB",
    "BOOSSSSSSSSSsSB",
    "BOBSBSBSBSBSBSB",
    "BSSfSSbSSSfSSSB",
    "BSBSBSBSBSBSBSB",
    "BSSSsSSSScSSSSB",
    "BSBSBSBSBSBSBSB",
    "BSSSSScSSSsSSSB",
    "BSBSBSBSBSBSBSB",
    "BSSbSSfSSSSbSSB",
    "BSBSBSBSBSBSBOB",
    "BSSsSSSSSSSSOOB",
    "BBBBBBBBBBBBBBB",
  ],
  // Level 3 — dense power-ups
  [
    "BBBBBBBBBBBBBBB",
    "BOOfSSSSSSSSbSB",
    "BOBSBSBSBSBSBSB",
    "BSSSbSfSSbSfSSB",
    "BSBSBSBSBSBSBSB",
    "BSfSScSSSSsSSSB",
    "BSBSBSBSBSBSBSB",
    "BSSSsSSSScSfSSB",
    "BSBSBSBSBSBSBSB",
    "BSfSSbSfSSsSSSB",
    "BSBSBSBSBSBSBOB",
    "BSSbScSSSSfSOOB",
    "BBBBBBBBBBBBBBB",
  ],
];
