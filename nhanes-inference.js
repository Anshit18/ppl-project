const fs = require('fs');
const path = require('path');
const Lexer = require('./src/lexer/lexer');
const Parser = require('./src/parser/parser');
const NHANESInterpreter = require('./src/interpreter/nhanes-interpreter');

/**
 * Importance sampling over the full NHANES dataset.
 * Uses log-sum-exp normalization for numerical stability.
 */
class NHANESImportanceSampling {
    constructor(ast, observations) {
        this.ast = ast;
        this.observations = observations;
        this.samples = [];
        this.logProbabilities = [];
        this.normalizedWeights = [];
    }

    run(numSamples) {
        console.log(`Running importance sampling with ${this.observations.length} observations...`);

        for (let i = 0; i < numSamples; i++) {
            const interpreter = new NHANESInterpreter(this.ast, this.observations);
            const result = interpreter.run();

            this.samples.push(result);
            this.logProbabilities.push(result.totalLogProb);

            if ((i + 1) % 100 === 0) {
                console.log(`Generated ${i + 1}/${numSamples} samples`);
            }
        }

        // Log-sum-exp normalization for numerical stability
        const maxLogProb = Math.max(...this.logProbabilities);
        const rawWeights = this.logProbabilities.map(lp => Math.exp(lp - maxLogProb));
        const sumWeights = rawWeights.reduce((sum, w) => sum + w, 0);
        this.normalizedWeights = rawWeights.map(w => w / sumWeights);

        const sumSquaredWeights = this.normalizedWeights.reduce((sum, w) => sum + w * w, 0);
        const ess = 1 / sumSquaredWeights;
        const essRatio = ess / numSamples;

        console.log(`\nImportance sampling completed:`);
        console.log(`- Effective Sample Size: ${ess.toFixed(2)} (${(essRatio * 100).toFixed(2)}%)`);

        return { effectiveSampleSize: ess, essRatio };
    }

    getWeightedStatistics(variableName) {
        const values = this.samples.map(s => s.variables[variableName]);

        const weightedMean = values.reduce((sum, val, idx) =>
            sum + val * this.normalizedWeights[idx], 0);

        const weightedVariance = values.reduce((sum, val, idx) =>
            sum + this.normalizedWeights[idx] * Math.pow(val - weightedMean, 2), 0);

        const sortedIndices = values
            .map((val, idx) => ({ val, idx }))
            .sort((a, b) => a.val - b.val);

        let cumulativeWeight = 0;
        let median = weightedMean;
        let q25 = weightedMean;
        let q75 = weightedMean;

        for (const { val, idx } of sortedIndices) {
            cumulativeWeight += this.normalizedWeights[idx];
            if (cumulativeWeight >= 0.25 && q25 === weightedMean) q25 = val;
            if (cumulativeWeight >= 0.50 && median === weightedMean) median = val;
            if (cumulativeWeight >= 0.75 && q75 === weightedMean) q75 = val;
        }

        return {
            mean: weightedMean,
            stdDev: Math.sqrt(weightedVariance),
            median,
            q25,
            q75,
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    getSamples() {
        return {
            algorithm: 'ImportanceSampling',
            numSamples: this.samples.length,
            samples: this.samples,
            logProbabilities: this.logProbabilities,
            weights: this.normalizedWeights
        };
    }
}

function runNHANESInference() {
    const nhanesPath = path.join(__dirname, 'data', 'nhanes_adults.json');
    const nhanesData = JSON.parse(fs.readFileSync(nhanesPath, 'utf8'));
    console.log(`Loaded ${nhanesData.length} NHANES observations`);

    const modelPath = path.join(__dirname, 'examples', 'nhanes-height-weight.ppl');
    const modelCode = fs.readFileSync(modelPath, 'utf8');

    const lexer = new Lexer(modelCode);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Importance sampling degrades with many observations (weights collapse).
    // 30 observations balances ESS quality with statistical accuracy.
    const SAMPLE_SIZE = 30;
    // Shuffle so the subset is representative, not just the first N rows
    const shuffled = nhanesData.slice().sort(() => Math.random() - 0.5);
    const subset = shuffled.slice(0, SAMPLE_SIZE);
    console.log(`Using ${subset.length} observations for inference\n`);

    const NUM_SAMPLES = 5000;
    const inference = new NHANESImportanceSampling(ast, subset);
    const metrics = inference.run(NUM_SAMPLES);

    const alphaStats = inference.getWeightedStatistics('alpha');
    const betaStats = inference.getWeightedStatistics('beta');
    const sigmaStats = inference.getWeightedStatistics('sigma');

    console.log('\n=== POSTERIOR STATISTICS ===');

    console.log('\nAlpha (Intercept):');
    console.log(`  Mean: ${alphaStats.mean.toFixed(4)}`);
    console.log(`  Std Dev: ${alphaStats.stdDev.toFixed(4)}`);
    console.log(`  IQR: [${alphaStats.q25.toFixed(2)}, ${alphaStats.q75.toFixed(2)}]`);

    console.log('\nBeta (Height Coefficient):');
    console.log(`  Mean: ${betaStats.mean.toFixed(4)}`);
    console.log(`  Std Dev: ${betaStats.stdDev.toFixed(4)}`);
    console.log(`  IQR: [${betaStats.q25.toFixed(2)}, ${betaStats.q75.toFixed(2)}]`);

    console.log('\nSigma (Error Std Dev):');
    console.log(`  Mean: ${sigmaStats.mean.toFixed(4)}`);
    console.log(`  Std Dev: ${sigmaStats.stdDev.toFixed(4)}`);
    console.log(`  IQR: [${sigmaStats.q25.toFixed(2)}, ${sigmaStats.q75.toFixed(2)}]`);

    const outputPath = path.join(__dirname, 'nhanes-inference-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(inference.getSamples(), null, 2));
    console.log(`\nResults saved to: ${outputPath}`);

    return { alphaStats, betaStats, sigmaStats, metrics };
}

if (require.main === module) {
    runNHANESInference();
}

module.exports = { runNHANESInference, NHANESImportanceSampling };
