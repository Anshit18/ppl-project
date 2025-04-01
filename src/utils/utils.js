/**
 * Utility functions for the PPL project
 */

// Generates a random number between min and max (inclusive)
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// Helper function for deep cloning objects (useful for AST manipulation)
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Error handler for better debugging
function error(message) {
    throw new Error(`PPL Error: ${message}`);
}

module.exports = {
    randomBetween,
    deepClone,
    error
};
