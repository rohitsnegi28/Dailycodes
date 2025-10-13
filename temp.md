function sanitizeObject(obj) {
  const clean = {};
  for (const [key, value] of Object.entries(obj || {})) {
    if (typeof value === "string") {
      clean[key] = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

const safeFasatValues = sanitizeObject(fasatValues);

<FasatPage
  backBtnEnabled
  backBtnText={t(staticCommonLabelKeys.COMMON_BUTTON_BACK)}
  showExportBtn={false}
  {...safeFasatValues}
/>