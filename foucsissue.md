Perfect — since you're in React and the button is deep inside a component you can't control, but you do have its id, here's the clean React way to apply that fix after a language change, and make it work even for manual focus:


---

✅ React Fix: Patch screen reader label on manual focus

import { useEffect } from "react";

function useFixManualFocusLabel(buttonId, language) {
  useEffect(() => {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const labelId = btn.getAttribute("aria-labelledby");
    if (!labelId) return;

    const refreshOnFocus = () => {
      btn.removeAttribute("aria-labelledby");

      setTimeout(() => {
        btn.setAttribute("aria-labelledby", labelId);
      }, 10);
    };

    // Add focus listener to fix screen reader label
    btn.addEventListener("focus", refreshOnFocus);

    // Cleanup
    return () => {
      btn.removeEventListener("focus", refreshOnFocus);
    };
  }, [buttonId, language]); // Run again on language change
}


---

How to use it:

In your React page or component:

useFixManualFocusLabel("button", currentLanguage);

Assuming currentLanguage is your i18n locale ('en', 'fr', etc.).


---

Why this works:

It triggers a reflow of the aria-labelledby label when the user focuses the button manually.

React's useEffect ensures it re-applies whenever your language changes.


Let me know if you want this as a custom hook or integrated with i18next if you're using that.

