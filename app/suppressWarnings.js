import { LogBox } from 'react-native';

export function suppressWarnings() {
  const warningsToSuppress = [
    'props.pointerEvents is deprecated',
    'EXGL: gl.pixelStorei()',
  ];
  
  const consoleWarn = console.warn;
  
  // stop chrome from flooding deprecation warnings
  // probably not the best way to do this
  console.warn = (...args) => {
    const shouldSuppressWarnings = warningsToSuppress.some(warning =>
      args.some(arg => arg.toLowerCase().includes(warning.toLowerCase()))
    );
    
    if (!shouldSuppressWarnings) {
      consoleWarn(...args);
    }
  };

  console.log('Suppressing warnings', warningsToSuppress);
  LogBox.ignoreLogs(warningsToSuppress);
}