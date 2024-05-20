const formatToPercentage = require('./path/to/your/formatToPercentage');

describe('formatToPercentage', () => {
    test('should return formatted percentage string for valid number input', () => {
        expect(formatToPercentage(0.12345)).toBe('0.12%');
        expect(formatToPercentage(1.98765)).toBe('1.98%');
        expect(formatToPercentage(1.456)).toBe('1.45%');
        expect(formatToPercentage(2)).toBe('2.00%');
    });

    test('should return formatted percentage string for valid string input', () => {
        expect(formatToPercentage("0.12345")).toBe('0.12%');
        expect(formatToPercentage("1.98765")).toBe('1.98%');
        expect(formatToPercentage("1.456")).toBe('1.45%');
        expect(formatToPercentage("2")).toBe('2.00%');
    });

    test('should return null if input is null', () => {
        expect(formatToPercentage(null)).toBe(null);
    });

    test('should return undefined if input is undefined', () => {
        expect(formatToPercentage(undefined)).toBe(undefined);
    });

    test('should throw TypeError for invalid input', () => {
        expect(() => formatToPercentage("abc")).toThrow(TypeError);
        expect(() => formatToPercentage({})).toThrow(TypeError);
        expect(() => formatToPercentage([])).toThrow(TypeError);
    });
});