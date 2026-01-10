export const tokens = {
  colors: {
    bg: "#0A0C10",
    surface: "#12141B",
    surface2: "#1B1F2A",
    text: "#F2F5FF",
    textMuted: "#9AA3B2",
    accent: "#3B82F6",
    danger: "#FF5D5D",
    success: "#2DD58A",
    borderSubtle: "rgba(255, 255, 255, 0.08)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 18,
  },
  type: {
    fontSizes: {
      title: 28,
      subtitle: 20,
      body: 16,
      caption: 12,
    },
    fontWeights: {
      regular: "400",
      medium: "500",
      bold: "700",
      heavy: "800",
    },
  },
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
  },
  gradients: {
    top: ["rgba(10, 12, 16, 0.9)", "rgba(10, 12, 16, 0)"] as const,
    bottom: ["rgba(10, 12, 16, 0)", "rgba(10, 12, 16, 0.9)"] as const,
  },
};

export type Theme = typeof tokens;
