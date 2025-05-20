const fs = require("fs");
const path = require("path");
const Lexer = require("./src/lexer/lexer");
const Parser = require("./src/parser/parser");
const Interpreter = require("./src/interpreter/interpreter");

// Configuration
const NUM_RUNS = 10000;
const EXAMPLE_NAME = "height-weight"; // Change this to run different examples
const OUTPUT_FILE = path.join(__dirname, `results_${EXAMPLE_NAME}_${NUM_RUNS}runs.json`);

// Load the specified example
const filePath = path.join(__dirname, "examples", `${EXAMPLE_NAME}.ppl`);
let programCode;
try {
    programCode = fs.readFileSync(filePath, "utf8");
    console.log(`Loaded program from ${filePath}`);
} catch (error) {
    console.error(`Error loading program: ${error.message}`);
    process.exit(1);
}

// Parse the program once (since parsing is deterministic)
const lexer = new Lexer(programCode);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();

if (ast.type === "Error") {
    console.error(`Parsing error: ${ast.message}`);
    process.exit(1);
}

console.log(`Running ${EXAMPLE_NAME}.ppl ${NUM_RUNS} times...`);

// Container for results
const results = {
    program: EXAMPLE_NAME,
    numRuns: NUM_RUNS,
    runs: []
};

// Run the program multiple times
for (let i = 0; i < NUM_RUNS; i++) {
    const interpreter = new Interpreter(ast);
    const result = interpreter.run();
    
    // Store relevant data from this run
    results.runs.push({
        variables: result.variables,
        totalLogProb: result.totalLogProb,
        modelEvidence: Math.exp(result.totalLogProb),
        observations: result.observations.map(obs => ({
            value: obs.value,
            distribution: obs.distribution,
            logProb: obs.logProb
        }))
    });
    
    // Show progress
    if ((i + 1) % 1000 === 0 || i === NUM_RUNS - 1) {
        console.log(`Completed ${i + 1}/${NUM_RUNS} runs`);
    }
}

// Save results to file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
console.log(`Results saved to ${OUTPUT_FILE}`);

// Basic statistics calculation
console.log("\nBasic Statistics:");

if (EXAMPLE_NAME === "height-weight") {
    // Calculate statistics for height-weight example
    const heights = results.runs.map(run => run.variables.height);
    const bmis = results.runs.map(run => run.variables.bmi);
    const logProbs = results.runs.map(run => run.totalLogProb);
    const evidences = results.runs.map(run => run.modelEvidence);
    
    console.log("Heights:");
    console.log(`  Mean: ${mean(heights)}`);
    console.log(`  StdDev: ${stdDev(heights)}`);
    console.log(`  Min: ${Math.min(...heights)}`);
    console.log(`  Max: ${Math.max(...heights)}`);
    
    console.log("\nBMI:");
    console.log(`  Mean: ${mean(bmis)}`);
    console.log(`  StdDev: ${stdDev(bmis)}`);
    console.log(`  Min: ${Math.min(...bmis)}`);
    console.log(`  Max: ${Math.max(...bmis)}`);
    
    console.log("\nLog Probabilities:");
    console.log(`  Mean: ${mean(logProbs)}`);
    console.log(`  StdDev: ${stdDev(logProbs)}`);
    console.log(`  Min: ${Math.min(...logProbs)}`);
    console.log(`  Max: ${Math.max(...logProbs)}`);
    
    console.log("\nModel Evidence:");
    console.log(`  Mean: ${mean(evidences)}`);
    console.log(`  StdDev: ${stdDev(evidences)}`);
    console.log(`  Min: ${Math.min(...evidences)}`);
    console.log(`  Max: ${Math.max(...evidences)}`);
    
    // Calculate histogram data for heights
    const heightHistogram = createHistogram(heights, 10);
    console.log("\nHeight Distribution (Histogram):");
    printHistogram(heightHistogram);
    
    // Calculate histogram data for log probabilities
    const logProbHistogram = createHistogram(logProbs, 10);
    console.log("\nLog Probability Distribution (Histogram):");
    printHistogram(logProbHistogram);
    
} else if (EXAMPLE_NAME === "coin-flip") {
    // Calculate statistics for coin-flip example
    const nextFlips = results.runs.map(run => run.variables.next_flip);
    const heads = nextFlips.filter(flip => flip === 1).length;
    const tails = nextFlips.filter(flip => flip === 0).length;
    
    console.log("Next Flip Predictions:");
    console.log(`  Heads (1): ${heads} (${(heads/NUM_RUNS*100).toFixed(2)}%)`);
    console.log(`  Tails (0): ${tails} (${(tails/NUM_RUNS*100).toFixed(2)}%)`);
    
    const logProbs = results.runs.map(run => run.totalLogProb);
    console.log("\nLog Probabilities:");
    console.log(`  Mean: ${mean(logProbs)}`);
    console.log(`  StdDev: ${stdDev(logProbs)}`);
    console.log(`  Min: ${Math.min(...logProbs)}`);
    console.log(`  Max: ${Math.max(...logProbs)}`);
}

// Statistical helper functions
function mean(array) {
    return array.reduce((sum, val) => sum + val, 0) / array.length;
}

function stdDev(array) {
    const avg = mean(array);
    const squareDiffs = array.map(value => {
        const diff = value - avg;
        return diff * diff;
    });
    const avgSquareDiff = mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

function createHistogram(data, numBins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const binWidth = range / numBins;
    
    const bins = Array(numBins).fill(0);
    const binLabels = [];
    
    for (let i = 0; i < numBins; i++) {
        const binStart = min + i * binWidth;
        const binEnd = min + (i + 1) * binWidth;
        binLabels.push(`${binStart.toFixed(2)} to ${binEnd.toFixed(2)}`);
    }
    
    data.forEach(value => {
        // Handle edge case for max value
        if (value === max) {
            bins[numBins - 1]++;
            return;
        }
        
        const binIndex = Math.floor((value - min) / binWidth);
        bins[binIndex]++;
    });
    
    return { bins, binLabels, binWidth };
}

function printHistogram(histogram) {
    const maxCount = Math.max(...histogram.bins);
    const scale = 40 / maxCount; // Scale to fit in console
    
    histogram.bins.forEach((count, i) => {
        const label = histogram.binLabels[i];
        const percentage = (count / NUM_RUNS * 100).toFixed(2);
        const barLength = Math.round(count * scale);
        const bar = '#'.repeat(barLength);
        
        console.log(`  ${label}: ${count} (${percentage}%) ${bar}`);
    });
}