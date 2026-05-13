const Interpreter = require('./interpreter');

/**
 * Extended interpreter that handles multiple NHANES observations.
 * Samples alpha, beta, sigma from the model, then accumulates log
 * probability across all data points instead of a single placeholder.
 */
class NHANESInterpreter extends Interpreter {
    constructor(ast, observations) {
        super(ast);
        this.nhanesObservations = observations;
    }

    run() {
        const result = super.run();

        // Replace the single-observation log prob with the full-dataset log prob
        let totalLogProb = 0;
        const alpha = result.variables.alpha;
        const beta = result.variables.beta;
        const sigma = result.variables.sigma;

        for (const obs of this.nhanesObservations) {
            const expectedWeight = alpha + beta * obs.Height;
            const diff = obs.Weight - expectedWeight;
            // Log PDF of Normal(expectedWeight, sigma)
            totalLogProb += -0.5 * Math.log(2 * Math.PI * sigma * sigma) -
                            (diff * diff) / (2 * sigma * sigma);
        }

        result.totalLogProb = totalLogProb;
        return result;
    }
}

module.exports = NHANESInterpreter;
