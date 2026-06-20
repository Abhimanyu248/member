import { useAppContext } from '../context/AppContext';

export const useThemeColors = () => {
  const context = useAppContext();
  // Fallback to lightColors if context is not loaded yet (e.g. initial render)
  if (!context) {
    const { lightColors } = require('./theme');
    return lightColors;
  }
  return context.colors;
};
