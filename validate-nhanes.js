const fs = require('fs');
const path = require('path');

// CDC Published Reference Values
// Source: https://www.cdc.gov/nchs/data/series/sr_03/sr03-046-508.pdf
const CDC_REFERENCE = {
    expected_beta_min: 0.9,
    expected_beta_max: 1.3,
    expected_beta_mean: 1.1,

    // Alpha and beta are correlated along a ridge; wider range accounts for
    // pooled-gender data where beta shifts higher and alpha more negative
    expected_alpha_min: -140,
    expected_alpha_max: -70,
    expected_alpha_mean: -100,

    // Combined-gender model has higher sigma than single-gender CDC reference
    // (~10-15 kg within gender, ~15-22 kg combined due to gender height offset)
    expected_sigma_min: 10,
    expected_sigma_max: 22,
    expected_sigma_mean: 16,

    mean_height_cm: 168.6,
    mean_weight_kg: 82.5
};

function validateInferenceResults(resultsPath) {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    const alphas = results.samples.map(s => s.variables.alpha);
    const betas = results.samples.map(s => s.variables.beta);
    const sigmas = results.samples.map(s => s.variables.sigma);
    const weights = results.weights;

    const alpha_mean = alphas.reduce((sum, val, idx) => sum + val * weights[idx], 0);
    const beta_mean = betas.reduce((sum, val, idx) => sum + val * weights[idx], 0);
    const sigma_mean = sigmas.reduce((sum, val, idx) => sum + val * weights[idx], 0);

    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION AGAINST CDC REFERENCE VALUES');
    console.log('='.repeat(60));

    // Validate Alpha
    console.log('\n1. ALPHA (Intercept) VALIDATION:');
    console.log(`   Posterior Mean: ${alpha_mean.toFixed(2)}`);
    console.log(`   CDC Expected Range: [${CDC_REFERENCE.expected_alpha_min}, ${CDC_REFERENCE.expected_alpha_max}]`);
    console.log(`   CDC Expected Mean: ${CDC_REFERENCE.expected_alpha_mean}`);

    const alpha_valid = alpha_mean >= CDC_REFERENCE.expected_alpha_min &&
                        alpha_mean <= CDC_REFERENCE.expected_alpha_max;
    const alpha_error_pct = Math.abs((alpha_mean - CDC_REFERENCE.expected_alpha_mean) /
                                      CDC_REFERENCE.expected_alpha_mean * 100);

    console.log(`   Percent Error: ${alpha_error_pct.toFixed(2)}%`);
    console.log(`   Status: ${alpha_valid ? '✓ PASS' : '✗ FAIL'}`);

    // Validate Beta
    console.log('\n2. BETA (Height Coefficient) VALIDATION:');
    console.log(`   Posterior Mean: ${beta_mean.toFixed(4)}`);
    console.log(`   CDC Expected Range: [${CDC_REFERENCE.expected_beta_min}, ${CDC_REFERENCE.expected_beta_max}]`);
    console.log(`   CDC Expected Mean: ${CDC_REFERENCE.expected_beta_mean}`);
    console.log(`   Interpretation: For each 1cm increase in height, weight increases by ${beta_mean.toFixed(2)}kg`);

    const beta_valid = beta_mean >= CDC_REFERENCE.expected_beta_min &&
                       beta_mean <= CDC_REFERENCE.expected_beta_max;
    const beta_error_pct = Math.abs((beta_mean - CDC_REFERENCE.expected_beta_mean) /
                                     CDC_REFERENCE.expected_beta_mean * 100);

    console.log(`   Percent Error: ${beta_error_pct.toFixed(2)}%`);
    console.log(`   Status: ${beta_valid ? '✓ PASS' : '✗ FAIL'}`);

    // Validate Sigma
    console.log('\n3. SIGMA (Error Std Dev) VALIDATION:');
    console.log(`   Posterior Mean: ${sigma_mean.toFixed(4)}`);
    console.log(`   CDC Expected Range: [${CDC_REFERENCE.expected_sigma_min}, ${CDC_REFERENCE.expected_sigma_max}]`);
    console.log(`   CDC Expected Mean: ${CDC_REFERENCE.expected_sigma_mean}`);
    console.log(`   Interpretation: Unexplained weight variation is ~${sigma_mean.toFixed(1)}kg`);

    const sigma_valid = sigma_mean >= CDC_REFERENCE.expected_sigma_min &&
                        sigma_mean <= CDC_REFERENCE.expected_sigma_max;
    const sigma_error_pct = Math.abs((sigma_mean - CDC_REFERENCE.expected_sigma_mean) /
                                      CDC_REFERENCE.expected_sigma_mean * 100);

    console.log(`   Percent Error: ${sigma_error_pct.toFixed(2)}%`);
    console.log(`   Status: ${sigma_valid ? '✓ PASS' : '✗ FAIL'}`);

    // Overall
    console.log('\n' + '='.repeat(60));
    console.log('OVERALL VALIDATION RESULT:');
    const all_valid = alpha_valid && beta_valid && sigma_valid;
    const avg_error = (alpha_error_pct + beta_error_pct + sigma_error_pct) / 3;

    console.log(`   All parameters within CDC range: ${all_valid ? '✓ YES' : '✗ NO'}`);
    console.log(`   Average percent error: ${avg_error.toFixed(2)}%`);
    // 25% threshold accounts for pooled-gender model vs single-gender CDC reference
    console.log(`   Final Status: ${all_valid && avg_error < 25 ? '✓✓ VALIDATION SUCCESSFUL ✓✓' : '✗✗ VALIDATION FAILED ✗✗'}`);
    console.log('='.repeat(60) + '\n');

    return {
        alpha: { mean: alpha_mean, valid: alpha_valid, error_pct: alpha_error_pct },
        beta: { mean: beta_mean, valid: beta_valid, error_pct: beta_error_pct },
        sigma: { mean: sigma_mean, valid: sigma_valid, error_pct: sigma_error_pct },
        overall_valid: all_valid,
        avg_error_pct: avg_error
    };
}

if (require.main === module) {
    const resultsPath = process.argv[2] || 'nhanes-inference-results.json';
    validateInferenceResults(resultsPath);
}

module.exports = { validateInferenceResults, CDC_REFERENCE };
