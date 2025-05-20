const fs = require('fs');
const path = require('path');

/**
 * Base class for inference algorithms
 */
class InferenceAlgorithm {
    constructor(interpreter) {
        this.interpreter = interpreter;
        this.samples = [];
        this.logProbabilities = [];
    }

    /**
     * Run the inference algorithm
     * @param {number} numSamples Number of samples to generate
     * @returns {Object} Results of the inference run
     */
    run(numSamples) {
        throw new Error('Method not implemented');
    }

    /**
     * Get the collected samples
     * @returns {Array} Array of sample objects
     */
    getSamples() {
        return this.samples;
    }

    /**
     * Calculate basic statistics on a variable
     * @param {string} variableName Name of the variable to analyze
     * @returns {Object} Statistics object with mean, stdDev, min, max
     */
    getStatistics(variableName) {
        if (this.samples.length === 0) {
            return { mean: null, stdDev: null, min: null, max: null };
        }

        const values = this.samples.map(sample => sample.variables[variableName]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        const squaredDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        
        return {
            mean,
            stdDev: Math.sqrt(variance),
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    /**
     * Save inference results to a JSON file
     * @param {string} filename Output filename
     */
    saveResults(filename) {
        const outputPath = path.join(process.cwd(), filename);
        const results = {
            algorithm: this.constructor.name,
            numSamples: this.samples.length,
            samples: this.samples,
            logProbabilities: this.logProbabilities
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`Results saved to ${outputPath}`);
    }
}

/**
 * Rejection Sampling implementation
 */
class RejectionSampling extends InferenceAlgorithm {
    /**
     * @param {Object} interpreter The PPL interpreter instance
     * @param {Function} condition Function that returns true if sample should be accepted
     */
    constructor(interpreter, condition) {
        super(interpreter);
        this.condition = condition || (result => true); // Default: accept all samples
        this.attempts = 0;
        this.acceptedCount = 0;
    }

    /**
     * Run rejection sampling
     * @param {number} numSamples Number of accepted samples to collect
     * @param {number} maxAttempts Maximum number of attempts before giving up
     * @returns {Object} Results including acceptance rate
     */
    run(numSamples, maxAttempts = numSamples * 100) {
        this.samples = [];
        this.logProbabilities = [];
        this.attempts = 0;
        this.acceptedCount = 0;

        console.log(`Starting rejection sampling to collect ${numSamples} samples...`);
        
        // Keep sampling until we have enough accepted samples or exceed max attempts
        while (this.samples.length < numSamples && this.attempts < maxAttempts) {
            // Reset interpreter state for a fresh run
            this.interpreter.resetState();
            
            // Run the program to get a sample
            const result = this.interpreter.run();
            this.attempts++;
            
            // Show periodic progress
            if (this.attempts % 1000 === 0) {
                console.log(`Attempts: ${this.attempts}, Accepted: ${this.samples.length}`);
            }
            
            // Check if the sample meets our condition
            if (this.condition(result)) {
                this.samples.push(result);
                this.logProbabilities.push(result.totalLogProb);
                this.acceptedCount++;
            }
        }
        
        const acceptanceRate = this.acceptedCount / this.attempts;
        console.log(`Rejection sampling completed:`);
        console.log(`- Attempts: ${this.attempts}`);
        console.log(`- Accepted: ${this.acceptedCount}`);
        console.log(`- Acceptance rate: ${(acceptanceRate * 100).toFixed(2)}%`);
        
        return {
            acceptanceRate,
            attempts: this.attempts,
            accepted: this.acceptedCount,
            success: this.samples.length >= numSamples
        };
    }
}

/**
 * Importance Sampling implementation
 */
class ImportanceSampling extends InferenceAlgorithm {
    constructor(interpreter) {
        super(interpreter);
        this.weights = [];
        this.normalizedWeights = [];
    }

    /**
     * Run importance sampling
     * @param {number} numSamples Number of samples to generate
     * @returns {Object} Results including effective sample size
     */
    run(numSamples) {
        this.samples = [];
        this.logProbabilities = [];
        this.weights = [];
        this.normalizedWeights = [];
        
        console.log(`Starting importance sampling to collect ${numSamples} samples...`);
        
        // Generate samples
        for (let i = 0; i < numSamples; i++) {
            // Reset interpreter state
            this.interpreter.resetState();
            
            // Run the program
            const result = this.interpreter.run();
            
            // Store the sample and its log probability
            this.samples.push(result);
            this.logProbabilities.push(result.totalLogProb);
            
            // Convert log probability to weight
            // Using exp(log_prob) to get back to probability space
            const weight = Math.exp(result.totalLogProb);
            this.weights.push(weight);
            
            // Show periodic progress
            if ((i + 1) % 1000 === 0) {
                console.log(`Generated ${i + 1}/${numSamples} samples`);
            }
        }
        
        // Normalize weights
        const sumWeights = this.weights.reduce((sum, w) => sum + w, 0);
        this.normalizedWeights = this.weights.map(w => w / sumWeights);
        
        // Calculate effective sample size
        const sumSquaredWeights = this.normalizedWeights.reduce((sum, w) => sum + w * w, 0);
        const effectiveSampleSize = 1 / sumSquaredWeights;
        
        console.log(`Importance sampling completed:`);
        console.log(`- Samples generated: ${numSamples}`);
        console.log(`- Effective sample size: ${effectiveSampleSize.toFixed(2)}`);
        console.log(`- ESS ratio: ${(effectiveSampleSize / numSamples * 100).toFixed(2)}%`);
        
        return {
            effectiveSampleSize,
            essRatio: effectiveSampleSize / numSamples
        };
    }

    /**
     * Get weighted statistics for a variable
     * @param {string} variableName Name of the variable to analyze
     * @returns {Object} Weighted statistics (mean, variance, etc.)
     */
    getWeightedStatistics(variableName) {
        if (this.samples.length === 0) {
            return { mean: null, stdDev: null, min: null, max: null };
        }
        
        const values = this.samples.map(sample => sample.variables[variableName]);
        
        // Calculate weighted mean
        let weightedSum = 0;
        for (let i = 0; i < values.length; i++) {
            weightedSum += values[i] * this.normalizedWeights[i];
        }
        const weightedMean = weightedSum;
        
        // Calculate weighted variance
        let weightedSumSquaredDiff = 0;
        for (let i = 0; i < values.length; i++) {
            const diff = values[i] - weightedMean;
            weightedSumSquaredDiff += diff * diff * this.normalizedWeights[i];
        }
        
        return {
            mean: weightedMean,
            stdDev: Math.sqrt(weightedSumSquaredDiff),
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }
}

module.exports = {
    InferenceAlgorithm,
    RejectionSampling,
    ImportanceSampling
};