// visualize-inference.js - Simplified version

const fs = require('fs');
const path = require('path');

// Main function to create HTML visualizations
function createInferenceVisualizations() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let inputFile = null;
    let outputDir = path.join(__dirname, 'inference-visualizations');
    
    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--input' && i + 1 < args.length) {
            inputFile = args[i + 1];
            i++;
        }
        else if (args[i] === '--output' && i + 1 < args.length) {
            outputDir = args[i + 1];
            i++;
        }
    }
    
    if (!inputFile) {
        console.error('Please specify an input file with --input');
        process.exit(1);
    }
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Load the inference results
    let results;
    try {
        const fullPath = path.resolve(inputFile);
        results = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        console.log(`Loaded inference results from ${fullPath}`);
    } catch (error) {
        console.error(`Error loading results: ${error.message}`);
        process.exit(1);
    }
    
    // Generate the HTML for visualizations
    const html = generateVisualizationsHTML(results);
    
    // Save the HTML file
    const outputBaseName = path.basename(inputFile, '.json');
    const outputFilePath = path.join(outputDir, `${outputBaseName}-visualizations.html`);
    fs.writeFileSync(outputFilePath, html);
    
    console.log(`Enhanced visualizations created: ${outputFilePath}`);
    console.log(`Open this file in your web browser to view the visualizations.`);
}

// Function to generate HTML content for visualizations
function generateVisualizationsHTML(results) {
    // Extract basic information
    const algorithm = results.algorithm;
    const numSamples = results.numSamples;
    
    // Extract all variable names
    const variableNames = Object.keys(results.samples[0]?.variables || {});
    
    // Prepare data for visualizations
    const variableData = {};
    
    variableNames.forEach(varName => {
        const values = results.samples.map(sample => sample.variables[varName]);
        variableData[varName] = {
            values,
            min: Math.min(...values),
            max: Math.max(...values),
            mean: calculateMean(values),
            median: calculatePercentile(values, 0.5),
            q1: calculatePercentile(values, 0.25),
            q3: calculatePercentile(values, 0.75),
            stdDev: calculateStdDev(values)
        };
    });
    
    // Handle weights for importance sampling
    let weights = null;
    if (algorithm === 'ImportanceSampling') {
        // Convert log probabilities to weights
        const logProbs = results.logProbabilities;
        const rawWeights = logProbs.map(lp => Math.exp(lp));
        const sumWeights = rawWeights.reduce((sum, w) => sum + w, 0);
        weights = rawWeights.map(w => w / sumWeights);
        
        // Calculate effective sample size
        const sumSquaredWeights = weights.reduce((sum, w) => sum + w * w, 0);
        const ess = 1 / sumSquaredWeights;
        variableData.ess = ess;
        variableData.essRatio = ess / numSamples;
    }
    
    // Create histogram data for each variable
    variableNames.forEach(varName => {
        const values = variableData[varName].values;
        const min = variableData[varName].min;
        const max = variableData[varName].max;
        
        const histogramData = createHistogramData(values, min, max, 30, weights);
        variableData[varName].histogram = histogramData;
    });
    
    // Generate HTML with visualizations
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inference Visualizations - ${algorithm}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            max-width: 1200px;
            margin: 0 auto;
            color: #333;
        }
        .chart-container {
            width: 100%;
            height: 400px;
            margin-bottom: 30px;
        }
        h1, h2, h3 {
            color: #2c3e50;
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
            color: #7f8c8d;
        }
        .stat-value {
            font-size: 1.2em;
            color: #2c3e50;
        }
        .algorithm-info {
            margin-top: 20px;
            padding: 15px;
            background-color: #e9f7ff;
            border-radius: 5px;
            border-left: 5px solid #3498db;
        }
        .tab-container {
            margin-top: 20px;
        }
        .tab-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 15px;
        }
        .tab-button {
            padding: 10px 16px;
            background-color: #f1f1f1;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        .tab-button:hover {
            background-color: #ddd;
        }
        .tab-button.active {
            background-color: #3498db;
            color: white;
        }
        .tab-content {
            display: none;
            animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .tab-content.active {
            display: block;
        }
        .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <h1>Inference Results Analysis: ${algorithm}</h1>
    
    <div class="algorithm-info">
        <h2>Algorithm: ${algorithm}</h2>
        <p><strong>Number of samples:</strong> ${numSamples}</p>
        ${algorithm === 'ImportanceSampling' ? 
            `<p><strong>Effective Sample Size:</strong> ${variableData.ess.toFixed(2)} (${(variableData.essRatio * 100).toFixed(2)}%)</p>` : 
            ''}
        ${algorithm === 'RejectionSampling' && results.acceptanceRate ? 
            `<p><strong>Acceptance Rate:</strong> ${(results.acceptanceRate * 100).toFixed(2)}%</p>
             <p><strong>Attempts:</strong> ${results.attempts}</p>` : 
            ''}
    </div>
    
    <div class="tab-container">
        <div class="tab-buttons">
            <button class="tab-button active" onclick="openTab(event, 'overview-tab')">Overview</button>
            ${variableNames.map(varName => 
                `<button class="tab-button" onclick="openTab(event, '${varName}-tab')">${varName}</button>`
            ).join('')}
            <button class="tab-button" onclick="openTab(event, 'log-prob-tab')">Log Probabilities</button>
        </div>
        
        <div id="overview-tab" class="tab-content active">
            <h2>Variables Overview</h2>
            
            <div class="stats-box">
                <h3>Statistical Summary</h3>
                <table style="width:100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 10px; border: 1px solid #ddd;">Variable</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Mean</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Median</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Std Dev</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Min</th>
                            <th style="padding: 10px; border: 1px solid #ddd;">Max</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${variableNames.map(varName => {
                            const data = variableData[varName];
                            return `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>${varName}</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${data.mean.toFixed(4)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${data.median.toFixed(4)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${data.stdDev.toFixed(4)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${data.min.toFixed(4)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${data.max.toFixed(4)}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <h3>Distribution Overview</h3>
            <div class="grid-container">
                ${variableNames.map(varName => `
                <div class="chart-container" style="height: 250px;">
                    <canvas id="${varName}-overview-chart"></canvas>
                </div>
                `).join('')}
            </div>
        </div>
        
        ${variableNames.map(varName => `
        <div id="${varName}-tab" class="tab-content">
            <h2>Variable: ${varName}</h2>
            
            <div class="stats-box">
                <h3>Detailed Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Mean</div>
                        <div class="stat-value">${variableData[varName].mean.toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Median</div>
                        <div class="stat-value">${variableData[varName].median.toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Std Dev</div>
                        <div class="stat-value">${variableData[varName].stdDev.toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Min</div>
                        <div class="stat-value">${variableData[varName].min.toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Max</div>
                        <div class="stat-value">${variableData[varName].max.toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">25th Percentile</div>
                        <div class="stat-value">${variableData[varName].q1.toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">75th Percentile</div>
                        <div class="stat-value">${variableData[varName].q3.toFixed(4)}</div>
                    </div>
                </div>
            </div>
            
            <h3>Distribution Histogram</h3>
            <div class="chart-container">
                <canvas id="${varName}-histogram"></canvas>
            </div>
            
            <h3>Variable Relationships</h3>
            <div class="chart-container">
                <canvas id="${varName}-relationships"></canvas>
            </div>
        </div>
        `).join('')}
        
        <div id="log-prob-tab" class="tab-content">
            <h2>Log Probabilities Analysis</h2>
            
            <div class="stats-box">
                <h3>Log Probability Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Mean</div>
                        <div class="stat-value">${calculateMean(results.logProbabilities).toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Median</div>
                        <div class="stat-value">${calculatePercentile(results.logProbabilities, 0.5).toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Std Dev</div>
                        <div class="stat-value">${calculateStdDev(results.logProbabilities).toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Min</div>
                        <div class="stat-value">${Math.min(...results.logProbabilities).toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Max</div>
                        <div class="stat-value">${Math.max(...results.logProbabilities).toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Model Evidence</div>
                        <div class="stat-value">${Math.exp(calculateMean(results.logProbabilities)).toFixed(6)}</div>
                    </div>
                </div>
            </div>
            
            <h3>Log Probability Distribution</h3>
            <div class="chart-container">
                <canvas id="log-prob-histogram"></canvas>
            </div>
            
            <h3>Log Probability vs Variables</h3>
            <div class="grid-container">
                ${variableNames.map(varName => `
                <div class="chart-container">
                    <canvas id="logprob-vs-${varName}"></canvas>
                </div>
                `).join('')}
            </div>
        </div>
    </div>

    <script>
        // Tab functionality
        function openTab(evt, tabName) {
            const tabContents = document.getElementsByClassName("tab-content");
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove("active");
            }
            
            const tabButtons = document.getElementsByClassName("tab-button");
            for (let i = 0; i < tabButtons.length; i++) {
                tabButtons[i].classList.remove("active");
            }
            
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
        }

        // Create charts
        window.onload = function() {
            // Overview charts
            ${variableNames.map(varName => `
            new Chart(document.getElementById('${varName}-overview-chart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(variableData[varName].histogram.labels)},
                    datasets: [{
                        label: '${varName}',
                        data: ${JSON.stringify(variableData[varName].histogram.counts)},
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '${varName} Distribution'
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Frequency'
                            }
                        }
                    }
                }
            });
            `).join('')}
            
            // Detailed variable charts
            ${variableNames.map(varName => `
            // Histogram
            new Chart(document.getElementById('${varName}-histogram').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ${JSON.stringify(variableData[varName].histogram.labels)},
                    datasets: [{
                        label: '${varName} Distribution',
                        data: ${JSON.stringify(variableData[varName].histogram.counts)},
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    const label = context[0].label.split(' - ');
                                    return \`Range: \${label[0]} to \${label[1]}\`;
                                },
                                label: function(context) {
                                    return \`Count: \${context.raw}\`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '${varName} Value'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Frequency'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Variable Relationships
            new Chart(document.getElementById('${varName}-relationships').getContext('2d'), {
                type: 'scatter',
                data: {
                    datasets: [
                        ${variableNames.filter(v => v !== varName).map((otherVar, i) => `
                        {
                            label: '${varName} vs ${otherVar}',
                            data: ${JSON.stringify(variableData[varName].values.map((val, idx) => ({
                                x: val,
                                y: variableData[otherVar].values[idx]
                            })).slice(0, 500))}, // Limit to 500 points for performance
                            backgroundColor: 'rgba(${54 + i*40}, ${162 - i*30}, ${235 - i*20}, 0.5)',
                            borderColor: 'rgba(${54 + i*40}, ${162 - i*30}, ${235 - i*20}, 1)',
                            pointRadius: 3
                        }
                        `).join(',')}
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '${varName} Relationships'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '${varName}'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Related Variables'
                            }
                        }
                    }
                }
            });
            `).join('')}
            
            // Log probability histogram
            const logProbHistogram = createHistogramData(
                ${JSON.stringify(results.logProbabilities)},
                ${Math.min(...results.logProbabilities)},
                ${Math.max(...results.logProbabilities)},
                30
            );
            
            new Chart(document.getElementById('log-prob-histogram').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: logProbHistogram.labels,
                    datasets: [{
                        label: 'Log Probability',
                        data: logProbHistogram.counts,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Log Probability Distribution'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Log Probability'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Frequency'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
            
            // Log Probability vs Variables
            ${variableNames.map(varName => `
            new Chart(document.getElementById('logprob-vs-${varName}').getContext('2d'), {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Log Prob vs ${varName}',
                        data: ${JSON.stringify(variableData[varName].values.map((val, idx) => ({
                            x: val,
                            y: results.logProbabilities[idx]
                        })).slice(0, 500))},
                        backgroundColor: 'rgba(255, 159, 64, 0.5)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Log Probability vs ${varName}'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '${varName}'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Log Probability'
                            }
                        }
                    }
                }
            });
            `).join('')}
        };
        
        // Helper function to create histogram data for charts
        function createHistogramData(values, min, max, numBins = 30) {
            const range = max - min;
            const binWidth = range / numBins;
            
            const counts = Array(numBins).fill(0);
            const labels = [];
            
            for (let i = 0; i < numBins; i++) {
                const binStart = min + i * binWidth;
                const binEnd = min + (i + 1) * binWidth;
                labels.push(\`\${binStart.toFixed(2)} - \${binEnd.toFixed(2)}\`);
                
                for (let j = 0; j < values.length; j++) {
                    if (values[j] >= binStart && (values[j] < binEnd || (i === numBins - 1 && values[j] === max))) {
                        counts[i]++;
                    }
                }
            }
            
            return { counts, labels };
        }
    </script>
</body>
</html>
    `;
}

// Helper functions for statistics
function calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStdDev(values) {
    const mean = calculateMean(values);
    const squaredDiffs = values.map(value => {
        const diff = value - mean;
        return diff * diff;
    });
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
}

function calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    // Sort values
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate index
    const index = Math.floor(percentile * sortedValues.length);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
}

// Helper function to create histogram data
function createHistogramData(values, min, max, numBins = 30, weights = null) {
    const range = max - min;
    const binWidth = range / numBins;
    
    const counts = Array(numBins).fill(0);
    const labels = [];
    
    for (let i = 0; i < numBins; i++) {
        const binStart = min + i * binWidth;
        const binEnd = min + (i + 1) * binWidth;
        labels.push(`${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`);
        
        if (weights) {
            // Weighted histogram for importance sampling
            for (let j = 0; j < values.length; j++) {
                if (values[j] >= binStart && (values[j] < binEnd || (i === numBins - 1 && values[j] === max))) {
                    counts[i] += weights[j];
                }
            }
        } else {
            // Regular histogram for rejection sampling
            for (let j = 0; j < values.length; j++) {
                if (values[j] >= binStart && (values[j] < binEnd || (i === numBins - 1 && values[j] === max))) {
                    counts[i]++;
                }
            }
        }
    }
    
    // For weighted histograms, scale up the counts for better visibility
    if (weights) {
        const scaleFactor = values.length / counts.reduce((sum, count) => sum + count, 0);
        for (let i = 0; i < counts.length; i++) {
            counts[i] *= scaleFactor;
        }
    }
    
    return { counts, labels };
}

// If this file is run directly
if (require.main === module) {
    createInferenceVisualizations();
}

module.exports = { createInferenceVisualizations };