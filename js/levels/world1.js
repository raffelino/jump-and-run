/**
 * Welt 1 - Grasland
 * Grüne Wiesen, Plattformen und einfache Hindernisse
 * 
 * Legende:
 * . = Luft (air)
 * G = Boden (ground)
 * B = Ziegel (brick)
 * P = Rohr (pipe)
 * p = Plattform (platform - nur von oben begehbar)
 * S = Stein (stone)
 * C = Kristall (crystal)
 * L = Lava (deadly - tödlich)
 * c = Wolke (cloud platform)
 * M = Metall (metal)
 * I = Eis (ice - rutschig)
 * W = Holz (wood)
 * o = Münze (coin)
 */

import { generateWorldLevels } from '../ProceduralLevelGenerator.js';

// Generiere 5 Level prozedural mit Seed 1000
// Level 3 hat eigenen Seed für besseres Layout
export const world1 = generateWorldLevels(5500, "Grasland", 5);
