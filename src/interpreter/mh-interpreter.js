const Interpreter = require('./interpreter');

/**
 * MH-aware interpreter that supports two modes:
 *
 * Sample mode (default): behaves exactly like the base Interpreter.
 *   sample(dist) → draws a random value, records which variable was sampled.
 *
 * Evaluate mode (when providedParams is set): uses fixed values for sampled
 *   variables and accumulates log-prior from those distributions.
 *   This lets MetropolisHastings score a proposed parameter set without
 *   re-sampling stochastically.
 */
class MHInterpreter extends Interpreter {
    constructor(ast) {
        super(ast);
        this.providedParams = null; // null = sample mode, object = evaluate mode
        this.logPrior = 0;
        this.sampledVars = new Set(); // names of variables set via sample()
        this._currentVar = null;     // name of the variable being assigned right now
    }

    resetState() {
        super.resetState();
        this.logPrior = 0;
        this._currentVar = null;
    }

    // Override evaluate only to intercept Assignment nodes so we can track
    // which variable name corresponds to each sample() call.
    evaluate(node) {
        if (!node) return null;

        if (node.type === 'Assignment') {
            this._currentVar = node.variable;
            const value = this.evaluate(node.expression);
            this.variables[node.variable] = value;
            this._currentVar = null;
            return value;
        }

        // Delegate everything else to the base class.
        // Recursive calls from the base class come back through this override,
        // so Assignment nodes in sub-expressions are still intercepted.
        return super.evaluate(node);
    }

    // Override sample() handling only.
    evaluateFunctionCall(node) {
        if (node.name === 'sample') {
            const args = node.arguments.map(arg => this.evaluate(arg));
            const dist = args[0];
            const varName = this._currentVar;

            if (this.providedParams !== null && varName !== null && varName in this.providedParams) {
                // Evaluate mode: use provided value, accumulate log-prior
                const value = this.providedParams[varName];
                this.logPrior += dist.logPdf(value);
                return value;
            }

            // Sample mode: draw from distribution and record which var was sampled
            if (varName !== null) this.sampledVars.add(varName);
            return dist.sample();
        }

        return super.evaluateFunctionCall(node);
    }

    /**
     * Evaluate the full program at fixed parameter values.
     * Returns the base run() result plus:
     *   logPrior     — sum of log p(param) under the PPL priors
     *   logPosterior — logPrior + totalLogProb (from observe() calls)
     */
    evaluateAt(params) {
        this.resetState();
        this.providedParams = params;
        const result = this.run();
        this.providedParams = null;
        result.logPrior = this.logPrior;
        result.logPosterior = this.logPrior + result.totalLogProb;
        return result;
    }
}

module.exports = MHInterpreter;
