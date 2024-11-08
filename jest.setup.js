 // Suppress punycode warning
process.emitWarning = (warning, type, ...args) => {
  if (type === 'DEP0040') return;
  return process.emitWarning(warning, type, ...args);
};