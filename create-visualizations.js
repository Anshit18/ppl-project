const fs = require("fs");
const path = require("path");

// Configuration
const EXAMPLE_NAME = "height-weight"; // Change this to match your data file
const NUM_RUNS = 10000;
const INPUT_FILE = path.join(__dirname, `results_${EXAMPLE_NAME}_${NUM_RUNS}runs.json`);
const OUTPUT_DIR = path.join(__dirname, "visualizations");
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${EXAMPLE_NAME}_visualizations.html`);

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load results
let results;
try {
    results = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
    console.log(`Loaded results from ${INPUT_FILE}`);
} catch (error) {
    console.error(`Error loading results: ${error.message}`);
    process.exit(1);
}

// Extract data based on the example
const extractData = () => {
    switch (EXAMPLE_NAME) {
        case "height-weight":
            return {
                heights: results.runs.map(run => run.variables.height),
                bmis: results.runs.map(run => run.variables.bmi),
                logProbs: results.runs.map(run => run.totalLogProb),
                modelEvidences: results.runs.map(run => run.modelEvidence),
                expectedWeights: results.runs.map(run => run.variables.expected_weight)
            };
        case "coin-flip":
            return {
                nextFlips: results.runs.map(run => run.variables.next_flip),
                logProbs: results.runs.map(run => run.totalLogProb),
                modelEvidences: results.runs.map(run => run.modelEvidence)
            };
        default:
            return {
                logProbs: results.runs.map(run => run.totalLogProb),
                modelEvidences: results.runs.map(run => run.modelEvidence)
            };
    }
};

const data = extractData();

// Function to create histogram data
const createHistogramData = (values, numBins = 30) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binWidth = range / numBins;
    
    const counts = Array(numBins).fill(0);
    const labels = [];
    
    for (let i = 0; i < numBins; i++) {
        const binStart = min + i * binWidth;
        const binEnd = min + (i + 1) * binWidth;
        labels.push((binStart + binEnd) / 2); // Use midpoint as label
        
        values.forEach(value => {
            if (value >= binStart && (value < binEnd || (i === numBins - 1 && value === max))) {
                counts[i]++;
            }
        });
    }
    
    return { counts, labels, min, max };
};

// Generate HTML for visualizations
const generateHtml = () => {
    // Create histogram data
    const heightHistData = EXAMPLE_NAME === "height-weight" ? createHistogramData(data.heights) : null;
    const bmiHistData = EXAMPLE_NAME === "height-weight" ? createHistogramData(data.bmis) : null;
    const logProbHistData = createHistogramData(data.logProbs);
    const evidenceHistData = createHistogramData(data.modelEvidences);
    
    // For coin-flip example
    const flipCounts = EXAMPLE_NAME === "coin-flip" ? [
        data.nextFlips.filter(flip => flip === 0).length,
        data.nextFlips.filter(flip => flip === 1).length
    ] : null;
    
    // For height vs expected weight scatter plot
    const scatterData = EXAMPLE_NAME === "height-weight" ? 
        data.heights.map((height, i) => ({ x: height, y: data.expectedWeights[i] })).slice(0, 1000) : // Limit to 1000 points for performance
        null;
    
    // Generate the HTML content
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PPL Analysis: ${EXAMPLE_NAME}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .chart-container {
            width: 100%;
            height: 400px;
            margin-bottom: 30px;
        }
        h1, h2 {
            color: #333;
        }
        .stats-box {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
        }
        .stat-item {
            padding: 10px;
            background-color: #fff;
            border: 1px solid #eee;
            border-radius: 3px;
        }
        .stat-label {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <h1>PPL Analysis: ${EXAMPLE_NAME} (${NUM_RUNS} Runs)</h1>
    
    <div class="stats-box">
        <h2>Statistical Summary</h2>
        <div class="stats-grid">
            ${EXAMPLE_NAME === "height-weight" ? `
            <div class="stat-item">
                <div class="stat-label">Mean Height</div>
                <div class="stat-value">${mean(data.heights).toFixed(2)} cm</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Height StdDev</div>
                <div class="stat-value">${stdDev(data.heights).toFixed(2)} cm</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Mean BMI</div>
                <div class="stat-value">${mean(data.bmis).toFixed(2)}</div>
            </div>` : ''}
            ${EXAMPLE_NAME === "coin-flip" ? `
            <div class="stat-item">
                <div class="stat-label">Heads Prediction</div>
                <div class="stat-value">${(flipCounts[1] / NUM_RUNS * 100).toFixed(2)}%</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Tails Prediction</div>
                <div class="stat-value">${(flipCounts[0] / NUM_RUNS * 100).toFixed(2)}%</div>
            </div>` : ''}
            <div class="stat-item">
                <div class="stat-label">Mean Log Probability</div>
                <div class="stat-value">${mean(data.logProbs).toFixed(4)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Mean Model Evidence</div>
                <div class="stat-value">${mean(data.modelEvidences).toFixed(4)}</div>
            </div>
        </div>
    </div>
    
    ${EXAMPLE_NAME === "height-weight" ? `
    <h2>Height Distribution</h2>
    <div class="chart-container">
        <canvas id="heightChart"></canvas>
    </div>
    
    <h2>BMI Distribution</h2>
    <div class="chart-container">
        <canvas id="bmiChart"></canvas>
    </div>
    
    <h2>Height vs Expected Weight</h2>
    <div class="chart-container">
        <canvas id="scatterChart"></canvas>
    </div>` : ''}
    
    ${EXAMPLE_NAME === "coin-flip" ? `
    <h2>Next Flip Predictions</h2>
    <div class="chart-container">
        <canvas id="flipChart"></canvas>
    </div>` : ''}
    
    <h2>Log Probability Distribution</h2>
    <div class="chart-container">
        <canvas id="logProbChart"></canvas>
    </div>
    
    <h2>Model Evidence Distribution</h2>
    <div class="chart-container">
        <canvas id="evidenceChart"></canvas>
    </div>

    <script>
        // Helper functions to create charts
        function createHistogram(canvasId, labels, data, color, title, xLabel, yLabel) {
            const ctx = document.getElementById(canvasId).getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: title,
                        data: data,
                        backgroundColor: color,
                        borderColor: color.replace('0.5', '1'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: title
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: xLabel
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: yLabel
                            }
                        }
                    }
                }
            });
        }
        
        function createScatterPlot(canvasId, data, color, title, xLabel, yLabel) {
            const ctx = document.getElementById(canvasId).getContext('2d');
            new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: title,
                        data: data,
                        backgroundColor: color,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: title
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: xLabel
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: yLabel
                            }
                        }
                    }
                }
            });
        }
        
        function createPieChart(canvasId, labels, data, colors, title) {
            const ctx = document.getElementById(canvasId).getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: title
                        }
                    }
                }
            });
        }
        
        // Create the charts
        ${EXAMPLE_NAME === "height-weight" ? `
        // Height Distribution
        createHistogram(
            'heightChart', 
            ${JSON.stringify(heightHistData.labels.map(l => l.toFixed(1)))}, 
            ${JSON.stringify(heightHistData.counts)}, 
            'rgba(54, 162, 235, 0.5)', 
            'Height Distribution', 
            'Height (cm)', 
            'Frequency'
        );
        
        // BMI Distribution
        createHistogram(
            'bmiChart', 
            ${JSON.stringify(bmiHistData.labels.map(l => l.toFixed(1)))}, 
            ${JSON.stringify(bmiHistData.counts)}, 
            'rgba(153, 102, 255, 0.5)', 
            'BMI Distribution', 
            'BMI', 
            'Frequency'
        );
        
        // Height vs Expected Weight Scatter Plot
        createScatterPlot(
            'scatterChart', 
            ${JSON.stringify(scatterData)}, 
            'rgba(255, 206, 86, 0.5)', 
            'Height vs Expected Weight', 
            'Height (cm)', 
            'Expected Weight (kg)'
        );` : ''}
        
        ${EXAMPLE_NAME === "coin-flip" ? `
        // Next Flip Distribution
        createPieChart(
            'flipChart',
            ['Tails (0)', 'Heads (1)'],
            [${flipCounts[0]}, ${flipCounts[1]}],
            ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)'],
            'Next Flip Predictions'
        );` : ''}
        
        // Log Probability Distribution
        createHistogram(
            'logProbChart', 
            ${JSON.stringify(logProbHistData.labels.map(l => l.toFixed(3)))}, 
            ${JSON.stringify(logProbHistData.counts)}, 
            'rgba(75, 192, 192, 0.5)', 
            'Log Probability Distribution', 
            'Log Probability', 
            'Frequency'
        );
        
        // Model Evidence Distribution
        createHistogram(
            'evidenceChart', 
            ${JSON.stringify(evidenceHistData.labels.map(l => l.toFixed(4)))}, 
            ${JSON.stringify(evidenceHistData.counts)}, 
            'rgba(255, 99, 132, 0.5)', 
            'Model Evidence Distribution', 
            'Model Evidence', 
            'Frequency'
        );
    </script>
</body>
</html>
    `;
    
    return html;
};

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

// Generate and save the HTML file
const html = generateHtml();
fs.writeFileSync(OUTPUT_FILE, html);

console.log(`Visualizations created: ${OUTPUT_FILE}`);
console.log(`Open this file in your web browser to view the charts.`);