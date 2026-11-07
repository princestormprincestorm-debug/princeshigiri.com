import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_CEMAC_SPECS,
  EUR_FIXED_RATE,
  convertXAF,
  buildDatasetManifest,
  simulateEpochMetrics,
  computeConfusionMatrix,
  calculateCoinTallySum,
  generate15PerClassTestRun,
  buildGoogleSheetsConfusionData
} from './coinModelLogic.ts';

test('CEMAC coin specifications contain official denominations', () => {
  assert.ok(OFFICIAL_CEMAC_SPECS['100_fcfa']);
  assert.ok(OFFICIAL_CEMAC_SPECS['250_fcfa']);
  assert.ok(OFFICIAL_CEMAC_SPECS['500_fcfa']);

  assert.equal(OFFICIAL_CEMAC_SPECS['100_fcfa'].valueXAF, 100);
  assert.equal(OFFICIAL_CEMAC_SPECS['250_fcfa'].valueXAF, 250);
  assert.equal(OFFICIAL_CEMAC_SPECS['500_fcfa'].valueXAF, 500);
  assert.equal(OFFICIAL_CEMAC_SPECS['500_fcfa'].standardDiameterMm, 28.0);
});

test('XAF to EUR & USD conversion is accurate', () => {
  const converted = convertXAF(655.957 * 10);
  assert.equal(converted.eur, 10.0);
  assert.ok(converted.usd > 0);

  const zeroConversion = convertXAF(0);
  assert.equal(zeroConversion.eur, 0);
  assert.equal(zeroConversion.usd, 0);

  assert.throws(() => convertXAF(-100));
});

test('buildDatasetManifest creates exactly 60 coin items matching 80/20 train/val split', () => {
  const manifest = buildDatasetManifest();
  assert.equal(manifest.length, 60);

  const c100 = manifest.filter(m => m.denominationKey === '100_fcfa');
  const c250 = manifest.filter(m => m.denominationKey === '250_fcfa');
  const c500 = manifest.filter(m => m.denominationKey === '500_fcfa');

  assert.equal(c100.length, 20);
  assert.equal(c250.length, 20);
  assert.equal(c500.length, 20);

  // Check validation indices: 4, 8, 12, 16 in 100 FCFA; 24, 28, 32, 36 in 250 FCFA; 44, 48, 52, 56 in 500 FCFA
  const valItems = manifest.filter(m => m.split === 'val');
  assert.equal(valItems.length, 12); // 4 per class * 3 classes = 12 items (20% of 60)

  const trainItems = manifest.filter(m => m.split === 'train');
  assert.equal(trainItems.length, 48); // 16 per class * 3 classes = 48 items (80% of 60)

  // Verify specific validation index
  const item4 = manifest.find(m => m.index === 4);
  assert.equal(item4?.split, 'val');
  const item1 = manifest.find(m => m.index === 1);
  assert.equal(item1?.split, 'train');
});

test('simulateEpochMetrics produces decaying loss and increasing accuracy', () => {
  const params = {
    backbone: 'resnet18' as const,
    epochs: 20,
    learningRate: 0.001,
    batchSize: 8,
    optimizer: 'adam' as const,
    useRotationAug: true,
    useColorJitter: true,
    useFlips: true,
  };

  const epoch1 = simulateEpochMetrics(params, 1);
  const epoch20 = simulateEpochMetrics(params, 20);

  assert.ok(epoch1.trainLoss > epoch20.trainLoss, 'Loss should decrease over epochs');
  assert.ok(epoch20.trainAcc >= epoch1.trainAcc, 'Train accuracy should improve');
  assert.ok(epoch20.valAcc > 80, 'Validation accuracy should reach high level with rotation aug');
});

test('computeConfusionMatrix computes correct matrix and accuracy', () => {
  const predictions = [
    { trueClass: '100_fcfa', predClass: '100_fcfa' },
    { trueClass: '100_fcfa', predClass: '100_fcfa' },
    { trueClass: '100_fcfa', predClass: '250_fcfa' }, // 1 mistake
    { trueClass: '250_fcfa', predClass: '250_fcfa' },
    { trueClass: '500_fcfa', predClass: '500_fcfa' },
  ];

  const result = computeConfusionMatrix(predictions);
  assert.equal(result.totalSamples, 5);
  assert.equal(result.overallAccuracy, 80); // 4/5 = 80%
  assert.equal(result.matrix[0][0], 2); // true 100, pred 100
  assert.equal(result.matrix[0][1], 1); // true 100, pred 250
});

test('calculateCoinTallySum accurately computes multi-coin totals', () => {
  const tally = {
    count100: 3, // 300 FCFA
    count250: 2, // 500 FCFA
    count500: 4, // 2000 FCFA
    otherCount: 1
  };

  const result = calculateCoinTallySum(tally);
  assert.equal(result.totalCount, 10);
  assert.equal(result.totalXAF, 2800);
  assert.ok(result.currencyConversion.eur > 4.0);
  assert.equal(result.breakdown[0].subtotalXAF, 300);
  assert.equal(result.breakdown[1].subtotalXAF, 500);
  assert.equal(result.breakdown[2].subtotalXAF, 2000);
});

test('generate15PerClassTestRun evaluates exactly 15 test images per class (45 total)', () => {
  const result = generate15PerClassTestRun();
  assert.equal(result.totalSamples, 45);
  assert.equal(result.testCases.length, 45);

  const test100 = result.testCases.filter(t => t.trueClass === '100_fcfa');
  const test250 = result.testCases.filter(t => t.trueClass === '250_fcfa');
  const test500 = result.testCases.filter(t => t.trueClass === '500_fcfa');

  assert.equal(test100.length, 15);
  assert.equal(test250.length, 15);
  assert.equal(test500.length, 15);

  // Each row in confusion matrix represents true class count (must equal 15)
  assert.equal(result.rowTotals[0], 15);
  assert.equal(result.rowTotals[1], 15);
  assert.equal(result.rowTotals[2], 15);

  // High overall accuracy > 90%
  assert.ok(result.overallAccuracy > 90);
});

test('buildGoogleSheetsConfusionData produces valid tabular structure for Sheets API', () => {
  const testRun = generate15PerClassTestRun();
  const sheetRows = buildGoogleSheetsConfusionData(testRun);

  assert.ok(sheetRows.length > 50, 'Should include header, matrix, and 45 sample rows');
  // First row is title
  assert.ok(typeof sheetRows[0][0] === 'string' && (sheetRows[0][0] as string).includes('CONFUSION MATRIX'));

  // Rows 8-10 are 3x3 confusion matrix rows
  assert.equal(sheetRows[8][0], 'True: 100 FCFA');
  assert.equal(sheetRows[8][4], 15); // Total count for true 100 FCFA
  assert.equal(sheetRows[9][0], 'True: 250 FCFA');
  assert.equal(sheetRows[9][4], 15); // Total count for true 250 FCFA
  assert.equal(sheetRows[10][0], 'True: 500 FCFA');
  assert.equal(sheetRows[10][4], 15); // Total count for true 500 FCFA
});

