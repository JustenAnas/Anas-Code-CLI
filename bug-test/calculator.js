function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

function multiply(a, b) {
    return a * b;
}
function divide(a, b) {
    // Bug: Should return null when dividing by zero, but returns Infinity
    if (b === 0) return null;
    return a / b;
}

console.log('divide(10, 0):', divide(10, 0)); // Should log: null
console.log('divide(10, 2):', divide(10, 2)); // Should log: 5

module.exports = {
    add,
    subtract,
    multiply,
    divide
};
