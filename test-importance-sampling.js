const { ImportanceSampling } = require('./src/interpreter/inference');
const Lexer = require('./src/lexer/lexer');
const Parser = require('./src/parser/parser');
const Interpreter = require('./src/interpreter/interpreter');
const fs = require('fs');

const testCode = `
mean_height = 170
std_height = 10
weight_factor = 0.5

height = sample(normal(mean_height, std_height))
expected_weight = height * weight_factor + 10
weight = 95

observe(weight, normal(expected_weight, 5))
bmi = weight / ((height / 100) * (height / 100))
`;

console.log('Testing Importance Sampling Implementation\n');

const lexer = new Lexer(testCode);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();
const interpreter = new Interpreter(ast);

const inference = new ImportanceSampling(interpreter);
const metrics = inference.run(1000);

console.log('\n=== Test Results ===');
console.log('ESS:', metrics.effectiveSampleSize.toFixed(2));
console.log('ESS Ratio:', (metrics.essRatio * 100).toFixed(2) + '%');

const heightStats = inference.getWeightedStatistics('height');
console.log('\nHeight Statistics:');
console.log('  Weighted Mean:', heightStats.mean.toFixed(2));
console.log('  Weighted StdDev:', heightStats.stdDev.toFixed(2));

const results = inference.getSamples();
fs.writeFileSync('test-importance-results.json', JSON.stringify(results, null, 2));
console.log('\nResults saved to test-importance-results.json');

// Validation checks
console.log('\n=== Validation ===');

const weightSum = results.weights.reduce((sum, w) => sum + w, 0);
const allWeightsSumToOne = Math.abs(weightSum - 1.0) < 0.0001;
console.log('Weights sum to 1.0:', allWeightsSumToOne ? '✓' : '✗');

const essReasonable = metrics.essRatio > 0.5 && metrics.essRatio <= 1.0;
console.log('ESS ratio reasonable (>50%):', essReasonable ? '✓' : '✗');

const heightMeanReasonable = heightStats.mean > 160 && heightStats.mean < 180;
console.log('Height mean reasonable (160-180cm):', heightMeanReasonable ? '✓' : '✗');

const essPositive = metrics.effectiveSampleSize > 0 &&
                    metrics.effectiveSampleSize <= 1000;
console.log('ESS within valid range (0, N]:', essPositive ? '✓' : '✗');

if (allWeightsSumToOne && essReasonable && heightMeanReasonable && essPositive) {
    console.log('\n✓✓ All tests passed! ✓✓');
} else {
    console.log('\n✗✗ Some tests failed ✗✗');
    process.exit(1);
}
