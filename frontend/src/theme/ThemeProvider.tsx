import { createContext, ReactNode } from "react";
import { tokens, Theme } from "./tokens";

export const ThemeContext = createContext<Theme>(tokens);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <ThemeContext.Provider value={tokens}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
