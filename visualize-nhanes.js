const fs = require('fs');
const path = require('path');
const { CDC_REFERENCE } = require('./validate-nhanes');

function generateNHANESVisualization(resultsPath) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    const alphas = results.samples.map(s => s.variables.alpha);
    const betas = results.samples.map(s => s.variables.beta);
    const sigmas = results.samples.map(s => s.variables.sigma);
    const weights = results.weights;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>NHANES PPL Validation Results</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
        h1 { color: #2c3e50; }
        h2 { color: #34495e; border-bottom: 2px solid #3498db; padding-bottom: 6px; }
        .chart-container { position: relative; width: 100%; height: 400px; margin-bottom: 50px; background: #fff; padding: 16px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .validation-box { background: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
        .validation-box p { margin: 6px 0; }
        .ref-label { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <h1>NHANES PPL Validation Results</h1>

    <div class="validation-box">
        <h3>Interpretation Guide</h3>
        <p><span class="ref-label">Red dashed line</span> = CDC Reference Value (ground truth)</p>
        <p><strong>Blue bars</strong> = PPL posterior distribution (weighted)</p>
        <p><strong>Goal</strong>: The posterior should be centered near the red line.</p>
    </div>

    <h2>Beta — Height Coefficient (kg/cm)</h2>
    <div class="chart-container"><canvas id="beta-chart"></canvas></div>

    <h2>Alpha — Intercept</h2>
    <div class="chart-container"><canvas id="alpha-chart"></canvas></div>

    <h2>Sigma — Error Std Dev (kg)</h2>
    <div class="chart-container"><canvas id="sigma-chart"></canvas></div>

    <script>
        const alphas  = ${JSON.stringify(alphas)};
        const betas   = ${JSON.stringify(betas)};
        const sigmas  = ${JSON.stringify(sigmas)};
        const weights = ${JSON.stringify(weights)};

        const CDC_BETA  = ${CDC_REFERENCE.expected_beta_mean};
        const CDC_ALPHA = ${CDC_REFERENCE.expected_alpha_mean};
        const CDC_SIGMA = ${CDC_REFERENCE.expected_sigma_mean};

        function weightedHistogram(values, weights, numBins) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const binWidth = (max - min) / numBins;
            const bins = new Array(numBins).fill(0);
            const labels = [];

            for (let i = 0; i < numBins; i++) {
                labels.push((min + i * binWidth).toFixed(3));
            }
            for (let j = 0; j < values.length; j++) {
                const bin = Math.min(Math.floor((values[j] - min) / binWidth), numBins - 1);
                bins[bin] += weights[j];
            }
            return { bins, labels, min, max, binWidth };
        }

        function refLineIndex(refValue, min, binWidth, numBins) {
            // Return the fractional bin index for a reference value
            return Math.min(Math.max((refValue - min) / binWidth, 0), numBins - 1);
        }

        function createChart(canvasId, values, cdcRef, xLabel) {
            const NUM_BINS = 30;
            const { bins, labels, min, binWidth } = weightedHistogram(values, weights, NUM_BINS);
            const refIdx = refLineIndex(cdcRef, min, binWidth, NUM_BINS);

            new Chart(document.getElementById(canvasId), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Posterior (weighted)',
                            data: bins,
                            backgroundColor: 'rgba(52, 152, 219, 0.55)',
                            borderColor: 'rgba(52, 152, 219, 0.9)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true },
                        title: {
                            display: true,
                            text: xLabel + '  |  CDC reference: ' + cdcRef
                        }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Value' }, ticks: { maxTicksLimit: 10 } },
                        y: { title: { display: true, text: 'Weighted frequency' } }
                    }
                },
                plugins: [{
                    id: 'cdcLine',
                    afterDraw(chart) {
                        const ctx = chart.ctx;
                        const xAxis = chart.scales.x;
                        const yAxis = chart.scales.y;

                        // Map reference to pixel position between bar centers
                        const xPx = xAxis.getPixelForValue(refIdx);

                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(xPx, yAxis.top);
                        ctx.lineTo(xPx, yAxis.bottom);
                        ctx.lineWidth = 2.5;
                        ctx.strokeStyle = '#e74c3c';
                        ctx.setLineDash([6, 4]);
                        ctx.stroke();

                        ctx.fillStyle = '#e74c3c';
                        ctx.font = 'bold 12px Arial';
                        ctx.fillText('CDC ref', xPx + 4, yAxis.top + 14);
                        ctx.restore();
                    }
                }]
            });
        }

        createChart('beta-chart',  betas,  CDC_BETA,  'Beta (height coefficient, kg/cm)');
        createChart('alpha-chart', alphas, CDC_ALPHA, 'Alpha (intercept)');
        createChart('sigma-chart', sigmas, CDC_SIGMA, 'Sigma (error std dev, kg)');
    </script>
</body>
</html>`;

    const outputPath = path.join(__dirname, 'inference-visualizations', 'nhanes-validation.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);

    console.log(`\nVisualization created: ${outputPath}`);
    console.log('Open this file in your web browser to view validation results.');
}

if (require.main === module) {
    const resultsPath = process.argv[2] || 'nhanes-inference-results.json';
    generateNHANESVisualization(resultsPath);
}

module.exports = { generateNHANESVisualization };
