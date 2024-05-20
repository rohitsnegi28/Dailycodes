function formatToPercentage(decimalValue) {
    // Ensure the value is a number
    if (typeof decimalValue !== 'number') {
        throw new TypeError('Input must be a number');
    }

    // Convert number to string with at least two decimal places
    let strValue = decimalValue.toString();
    
    // Find the position of the decimal point
    let dotIndex = strValue.indexOf('.');
    
    // If there is no decimal point, add '.00' to the end
    if (dotIndex === -1) {
        strValue += '.00';
    } else {
        // Ensure there are at least two decimal places
        let decimalPart = strValue.substring(dotIndex + 1);
        if (decimalPart.length < 2) {
            strValue += '0';
        } else if (decimalPart.length > 2) {
            strValue = strValue.substring(0, dotIndex + 3);
        }
    }

    // Append the percentage sign
    return strValue + '%';
}

// Example usage:
console.log(formatToPercentage(0.12345)); // Output: "0.12%"
console.log(formatToPercentage(1.98765)); // Output: "1.98%"
console.log(formatToPercentage(1.456));   // Output: "1.45%"
console.log(formatToPercentage(2));       // Output: "2.00%"