#!/bin/bash

echo "=========================================="
echo "NHANES PPL Validation Pipeline"
echo "=========================================="
echo ""

if [ ! -f "data/nhanes_adults.json" ]; then
    echo "ERROR: NHANES data not found at data/nhanes_adults.json"
    echo "Please run the R script to download data first:"
    echo "  Rscript scripts/export_nhanes.R"
    exit 1
fi

echo "Step 1: Running inference on NHANES data..."
node nhanes-inference.js
if [ $? -ne 0 ]; then
    echo "ERROR: Inference failed"
    exit 1
fi

echo ""
echo "Step 2: Validating against CDC reference values..."
node validate-nhanes.js nhanes-inference-results.json
if [ $? -ne 0 ]; then
    echo "ERROR: Validation failed"
    exit 1
fi

echo ""
echo "Step 3: Generating visualizations..."
node visualize-nhanes.js nhanes-inference-results.json
if [ $? -ne 0 ]; then
    echo "ERROR: Visualization failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "Validation Complete!"
echo "=========================================="
echo "Results saved to:"
echo "  - nhanes-inference-results.json"
echo "  - inference-visualizations/nhanes-validation.html"
echo ""
echo "Open the HTML file in your browser to view results."
