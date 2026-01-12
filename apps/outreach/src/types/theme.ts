export const themeColors = {
    black: "#000000",
    purple: "#9D00FF",
    red: "#FF0066",
    blue: "#0066FF",
    white: "#FFFFFF",
} as const

export type ThemeColor = keyof typeof themeColors
