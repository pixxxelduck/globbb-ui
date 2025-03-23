import { THEMES, DEFAULT_THEME } from "../../constants/themes";

export default (theme, variant) => {
  // Проверяем, существует ли тема, иначе используем дефолтную
  const actualTheme = THEMES[theme] ? theme : DEFAULT_THEME;

  // Определяем стилевые переменные для кнопки на основе темы и варианта
  return {
    // Основные цвета зависят от варианта (primary или secondary)
    "--button-background-color":
      variant === "secondary"
        ? "transparent"
        : `var(--theme-${actualTheme}-light)`,
    "--button-color":
      variant === "secondary"
        ? `var(--theme-${actualTheme}-light)`
        : `var(--theme-${actualTheme}-dark-80)`,
    "--button-border": `var(--theme-${actualTheme}-light)`,

    // Цвета для состояния hover
    "--button-hover-background-color":
      variant === "secondary"
        ? "transparent"
        : `var(--theme-${actualTheme}-dark-80)`,
    "--button-hover-color":
      variant === "secondary"
        ? `var(--theme-${actualTheme}-dark-80)`
        : `var(--theme-${actualTheme}-light)`,
    "--button-hover-border":
      variant === "secondary"
        ? `var(--theme-${actualTheme}-dark-80)`
        : "transparent",

    // Цвета для состояния active
    "--button-active-background-color":
      variant === "secondary"
        ? "transparent"
        : `var(--theme-${actualTheme}-dark)`,
    "--button-active-color": `var(--theme-${actualTheme}-light)`,
    "--button-active-border":
      variant === "secondary"
        ? `var(--theme-${actualTheme}-dark-50)`
        : `var(--theme-${actualTheme}-dark)`,
  };
};
