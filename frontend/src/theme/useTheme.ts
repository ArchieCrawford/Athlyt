import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import { tokens } from "./tokens";

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  return theme ?? tokens;
};
