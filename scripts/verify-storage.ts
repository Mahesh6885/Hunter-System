// Verification test suite for Hunter Storage Service defensive parsing and sanitization
import { sanitizeHunterState } from '../src/storage/storageService';
import { INITIAL_HUNTER_STATE } from '../src/data/mockData';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n--- Running Hunter Storage Service Defensive Tests ---');

// Test 1: Null or empty input falls back to default state
const nullResult = sanitizeHunterState(null);
assert(nullResult.name === INITIAL_HUNTER_STATE.name, 'Null input produces initial hunter name');
assert(nullResult.level === INITIAL_HUNTER_STATE.level, 'Null input produces initial level');
assert(nullResult.currentOverlay === null, 'Null input sets currentOverlay to null');

// Test 2: Valid partial state merges properly
const validPartial = {
  name: 'SUNG JIN-WOO',
  level: 50,
  xp: 1200,
  rank: 'S' as const,
  attributes: { strength: 99, endurance: 85, agility: 92, vitality: 80, discipline: 75 },
};
const partialResult = sanitizeHunterState(validPartial);
assert(partialResult.name === 'SUNG JIN-WOO', 'Custom name is preserved');
assert(partialResult.level === 50, 'Custom level 50 is preserved');
assert(partialResult.rank === 'S', 'Valid Rank S is accepted');
assert(partialResult.attributes.strength === 99, 'Strength 99 is preserved');
assert(partialResult.maxXP === INITIAL_HUNTER_STATE.maxXP, 'Missing maxXP falls back to initial value');

// Test 3: Corrupt and NaN values are caught and sanitized
const corruptData = {
  name: 'GLITCH',
  level: NaN,
  xp: -100,
  rank: 'INVALID_RANK' as any,
  attributes: { strength: 'strong' as any, endurance: NaN },
};
const corruptResult = sanitizeHunterState(corruptData);
assert(corruptResult.level === INITIAL_HUNTER_STATE.level, 'NaN level sanitized to initial value');
assert(corruptResult.xp === 0, 'Negative XP clamped to 0');
assert(corruptResult.rank === INITIAL_HUNTER_STATE.rank, 'Invalid rank sanitized to default rank');
assert(corruptResult.attributes.strength === INITIAL_HUNTER_STATE.attributes.strength, 'Invalid string attribute fallback');

// Test 4: Ephemeral currentOverlay is stripped
const stateWithOverlay = {
  ...INITIAL_HUNTER_STATE,
  currentOverlay: 'lvl' as const,
};
const cleanedResult = sanitizeHunterState(stateWithOverlay);
assert(cleanedResult.currentOverlay === null, 'Active overlay is stripped on restore');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('All storage integrity and defensive sanitization tests passed successfully!\n');
}
