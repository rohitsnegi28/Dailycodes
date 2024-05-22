const trimString = require('./trimString'); // Adjust the path as necessary

test('should return empty string for null', () => {
    expect(trimString(null)).toBe('');
});

test('should return empty string for undefined', () => {
    expect(trimString(undefined)).toBe('');
});

test('should trim leading and trailing spaces', () => {
    expect(trimString('  hello  ')).toBe('hello');
});

test('should return the same string if no leading or trailing spaces', () => {
    expect(trimString('world')).toBe('world');
});

test('should handle empty string', () => {
    expect(trimString('')).toBe('');
});

test('should handle non-string input by converting to string and trimming', () => {
    expect(trimString(42)).toBe('42');
    expect(trimString(true)).toBe('true');
    expect(trimString({})).toBe('[object Object]');
});