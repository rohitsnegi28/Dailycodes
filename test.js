function formatDecimal(number) {
    // Convert number to string
    let numberStr = number.toString();

    // Split the number into integer and decimal parts
    let parts = numberStr.split('.');
    
    // If there are no decimal places, add '.0000' to the end
    if (parts.length === 1) {
        return numberStr + '.0000';
    }

    // If there are less than 4 decimal places, pad zeros
    if (parts[1].length < 4) {
        parts[1] = parts[1].padEnd(4, '0');
    } else {
        // If there are more than 4 decimal places, truncate
        parts[1] = parts[1].substring(0, 4);
    }

    // Join the parts back together and return
    return parts.join('.');
}

// Example usage:
let originalNumber = 12.3456789;
let formattedNumber = formatDecimal(originalNumber);
console.log(formattedNumber); // Output: 12.3456