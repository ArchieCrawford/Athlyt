import { createContext, ReactNode, useMemo } from "react";
import { tokens, Theme } from "./tokens";

export const ThemeContext = createContext<Theme>(tokens);

export default function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const theme = useMemo(() => tokens, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
