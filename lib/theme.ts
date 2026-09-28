// Shared by the server layout (boot script) and the client ThemeToggle — no "use client" here,
// so the server gets the real string rather than a client reference.
export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "bachato-theme";

/**
 * Runs inline in <head> before first paint so a light-theme user never sees
 * a dark flash. Kept as a string because it must execute before React loads.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}")||"dark";var l=p==="light"||(p==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches);document.documentElement.dataset.theme=l?"light":"dark";}catch(e){}})();`;

