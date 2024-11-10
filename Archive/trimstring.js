const trimString = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    return value.toString().trim();
};

module.exports = trimString;