// Keep the visible copyright year current without adding cookies or network calls.
document.querySelectorAll('[data-current-year]').forEach(node => {
  node.textContent = String(new Date().getFullYear());
});
