import { LogBox } from 'react-native';

export function suppressWarnings() {
  const warningsToSuppress = [
    'props.pointerEvents is deprecated',
    'selectable prop is deprecated',
    'accessibilityRole is deprecated',
    /^EXGL/,
    'pixelStorei',
  ];

  const consoleWarn = console.warn;

  console.warn = (...args) => {
    const shouldSuppressWarning = warningsToSuppress.some((warning) => {
      if (warning instanceof RegExp) {
        return args.some((arg) => warning.test(String(arg)));
      }
      return args.some((arg) => String(arg).includes(warning));
    });

    if (!shouldSuppressWarning) {
      consoleWarn(...args);
    }
  };

  // Convert RegExp to strings for LogBox
  const logBoxWarnings = warningsToSuppress.map((warning) =>
    warning instanceof RegExp ? warning.source : warning,
  );

  console.log('Suppressing warnings:', logBoxWarnings);
  LogBox.ignoreLogs(logBoxWarnings);
  LogBox.ignoreAllLogs();
}
