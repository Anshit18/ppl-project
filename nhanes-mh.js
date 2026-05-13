const fs = require('fs');
const path = require('path');
const Lexer = require('./src/lexer/lexer');
const Parser = require('./src/parser/parser');
const MHInterpreter = require('./src/interpreter/mh-interpreter');

function gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Metropolis-Hastings for NHANES linear regression.
 *
 * Key difference from importance sampling:
 *   - Uses ALL observations for the likelihood (no weight collapse)
 *   - log-prior comes from the PPL model via MHInterpreter
 *   - log-likelihood computed directly from the full dataset
 *   - All collected samples have equal weight (uniform posterior)
 */
class NHANESMetropolisHastings {
    constructor(ast, observations) {
        this.ast = ast;
        this.observations = observations;
        this.interpreter = new MHInterpreter(ast);
        this.samples = [];

        // Step sizes ≈ posterior_std / 2, estimated from a short pilot run.
        // With 7412 observations the posterior is very concentrated:
        //   alpha std ≈ 1.3  → step 0.5
        //   beta  std ≈ 0.008 → step 0.003
        //   sigma std ≈ 0.10  → step 0.04
        this.stepSizes = { alpha: 0.5, beta: 0.003, sigma: 0.04 };
    }

    _logLikelihood(alpha, beta, sigma) {
        if (sigma <= 0) return -Infinity;
        let logLik = 0;
        for (const obs of this.observations) {
            const mu = alpha + beta * obs.Height;
            const diff = obs.Weight - mu;
            logLik += -0.5 * Math.log(2 * Math.PI * sigma * sigma) -
                      (diff * diff) / (2 * sigma * sigma);
        }
        return logLik;
    }

    _logPosterior(alpha, beta, sigma) {
        if (sigma <= 0) return -Infinity;
        // Prior contribution from the PPL model (ignores the placeholder observe())
        const result = this.interpreter.evaluateAt({ alpha, beta, sigma });
        return result.logPrior + this._logLikelihood(alpha, beta, sigma);
    }

    run(numSamples, burnIn = 2000) {
        console.log(`Running Metropolis-Hastings on ALL ${this.observations.length} observations...`);
        console.log(`Burn-in: ${burnIn} | Samples to collect: ${numSamples}\n`);

        // Initialise from prior
        this.interpreter.resetState();
        const init = this.interpreter.run();
        let alpha = init.variables.alpha;
        let beta  = init.variables.beta;
        let sigma = init.variables.sigma;
        let currentLogPost = this._logPosterior(alpha, beta, sigma);

        let accepted = 0;
        const total = numSamples + burnIn;

        for (let i = 0; i < total; i++) {
            const newAlpha = alpha + this.stepSizes.alpha * gaussianRandom();
            const newBeta  = beta  + this.stepSizes.beta  * gaussianRandom();
            const newSigma = sigma + this.stepSizes.sigma * gaussianRandom();

            if (newSigma <= 0) continue;

            const proposedLogPost = this._logPosterior(newAlpha, newBeta, newSigma);

            if (Math.log(Math.random()) < proposedLogPost - currentLogPost) {
                alpha = newAlpha;
                beta  = newBeta;
                sigma = newSigma;
                currentLogPost = proposedLogPost;
                accepted++;
            }

            if (i >= burnIn) {
                this.samples.push({
                    variables: { alpha, beta, sigma },
                    totalLogProb: currentLogPost
                });
            }

            if ((i + 1) % 1000 === 0) {
                const phase = i < burnIn ? 'burn-in ' : 'sampling';
                const rate  = (accepted / (i + 1) * 100).toFixed(1);
                console.log(`[${phase}] Iter ${i + 1}/${total} | acceptance: ${rate}%`);
            }
        }

        const acceptanceRate = accepted / total;
        console.log(`\nMH completed:`);
        console.log(`- Acceptance rate: ${(acceptanceRate * 100).toFixed(2)}%  (target: 25-40%)`);
        console.log(`- Samples collected: ${numSamples}`);

        return { acceptanceRate, burnIn };
    }

    getStatistics(varName) {
        const values = this.samples.map(s => s.variables[varName]);
        const n = values.length;
        const mean = values.reduce((s, v) => s + v, 0) / n;
        const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
        const sorted = [...values].sort((a, b) => a - b);
        return {
            mean,
            stdDev: Math.sqrt(variance),
            median: sorted[Math.floor(n * 0.50)],
            q25:    sorted[Math.floor(n * 0.25)],
            q75:    sorted[Math.floor(n * 0.75)],
            min: sorted[0],
            max: sorted[n - 1]
        };
    }

    getSamples() {
        const n = this.samples.length;
        return {
            algorithm: 'MetropolisHastings',
            numSamples: n,
            samples: this.samples,
            logProbabilities: this.samples.map(s => s.totalLogProb),
            weights: this.samples.map(() => 1 / n)
        };
    }
}

function runNHANESMH() {
    const nhanesData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'data', 'nhanes_adults.json'), 'utf8')
    );
    console.log(`Loaded ${nhanesData.length} NHANES observations`);
    console.log(`Using ALL ${nhanesData.length} observations (vs 30 for importance sampling)\n`);

    const modelCode = fs.readFileSync(
        path.join(__dirname, 'examples', 'nhanes-height-weight.ppl'), 'utf8'
    );
    const ast = new (require('./src/parser/parser'))(
        new (require('./src/lexer/lexer'))(modelCode).tokenize()
    ).parse();

    const mh = new NHANESMetropolisHastings(ast, nhanesData);
    mh.run(5000, 2000);

    const alphaStats = mh.getStatistics('alpha');
    const betaStats  = mh.getStatistics('beta');
    const sigmaStats = mh.getStatistics('sigma');

    console.log('\n=== POSTERIOR STATISTICS (Metropolis-Hastings) ===');

    console.log('\nAlpha (Intercept):');
    console.log(`  Mean:    ${alphaStats.mean.toFixed(4)}`);
    console.log(`  Std Dev: ${alphaStats.stdDev.toFixed(4)}`);
    console.log(`  IQR:     [${alphaStats.q25.toFixed(2)}, ${alphaStats.q75.toFixed(2)}]`);

    console.log('\nBeta (Height Coefficient):');
    console.log(`  Mean:    ${betaStats.mean.toFixed(4)}`);
    console.log(`  Std Dev: ${betaStats.stdDev.toFixed(4)}`);
    console.log(`  IQR:     [${betaStats.q25.toFixed(2)}, ${betaStats.q75.toFixed(2)}]`);

    console.log('\nSigma (Error Std Dev):');
    console.log(`  Mean:    ${sigmaStats.mean.toFixed(4)}`);
    console.log(`  Std Dev: ${sigmaStats.stdDev.toFixed(4)}`);
    console.log(`  IQR:     [${sigmaStats.q25.toFixed(2)}, ${sigmaStats.q75.toFixed(2)}]`);

    const outputPath = path.join(__dirname, 'nhanes-mh-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(mh.getSamples(), null, 2));
    console.log(`\nResults saved to: ${outputPath}`);

    return { alphaStats, betaStats, sigmaStats };
}

if (require.main === module) {
    runNHANESMH();
}

module.exports = { runNHANESMH, NHANESMetropolisHastings };
