// src/components/UI/Button/Button.jsx
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { THEMES, DEFAULT_THEME } from "../../constants/themes";
import styles from "./Button.module.css";

/**
 * Универсальный компонент кнопки с поддержкой рендеринга в виде ссылки
 *
 * @param {Object} props - свойства компонента
 * @param {string} [props.variant='filled'] - вариант кнопки ('filled', 'outline')
 * @param {string} [props.size='normal'] - размер кнопки ('normal', 'big')
 * @param {string} [props.theme='ash-gray'] - цветовая тема
 * @param {boolean} [props.disabled=false] - отключена ли кнопка
 * @param {string} [props.className] - дополнительные классы
 * @param {React.ReactNode} props.children - содержимое кнопки
 * @param {function} [props.onClick] - обработчик клика
 * @param {string} [props.type='button'] - тип кнопки
 * @param {string} [props.to] - адрес ссылки (если указан, кнопка будет ссылкой)
 * @param {string} [props.href] - адрес внешней ссылки (если указан, кнопка будет ссылкой <a>)
 * @param {string} [props.as] - компонент для рендеринга (например, 'a', 'button', Link)
 */
const Button = ({
  variant = "filled",
  size = "normal",
  theme = DEFAULT_THEME,
  disabled = false,
  className = "",
  children,
  onClick,
  type = "button",
  to,
  href,
  as,
  ...rest
}) => {
  // Проверяем, существует ли тема, иначе используем дефолтную
  const actualTheme = THEMES[theme] ? theme : DEFAULT_THEME;

  // Определяем стилевые переменные для кнопки на основе темы и варианта
  const buttonStyle = {
    // Основные цвета зависят от варианта (filled или outline)
    "--button-bg":
      variant === "outline"
        ? "transparent"
        : `var(--theme-${actualTheme}-primary)`,
    "--button-color":
      variant === "outline"
        ? `var(--theme-${actualTheme}-primary)`
        : `var(--theme-${actualTheme}-dark-80)`,
    "--button-border": `var(--theme-${actualTheme}-primary)`,

    // Цвета для состояния hover
    "--button-hover-bg":
      variant === "outline"
        ? "transparent"
        : `var(--theme-${actualTheme}-dark-80)`,
    "--button-hover-color":
      variant === "outline"
        ? `var(--theme-${actualTheme}-dark-80)`
        : `var(--theme-${actualTheme}-primary)`,
    "--button-hover-border":
      variant === "outline"
        ? `var(--theme-${actualTheme}-dark-80)`
        : "transparent",

    // Цвета для состояния active
    "--button-active-bg":
      variant === "outline"
        ? "transparent"
        : `var(--theme-${actualTheme}-dark)`,
    "--button-active-color": `var(--theme-${actualTheme}-primary)`,
    "--button-active-border":
      variant === "outline"
        ? `var(--theme-${actualTheme}-dark-50)`
        : `var(--theme-${actualTheme}-dark)`,
  };

  // Определяем основной класс в зависимости от варианта и размера
  const buttonClasses = [
    styles.Base,
    variant === "outline" ? styles.Outline : styles.Filled,
    size === "big" ? styles.Big : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const commonProps = {
    className: buttonClasses,
    style: buttonStyle,
    disabled: disabled,
    onClick: onClick,
    ...rest,
  };

  // Определяем, какой элемент рендерить
  // 1. Если передан явный компонент через as, используем его
  // 2. Если передан to, используем компонент Link из react-router
  // 3. Если передан href, используем обычный тег <a>
  // 4. В остальных случаях используем <button>

  if (as) {
    // Пользовательский компонент
    const CustomComponent = as;
    return <CustomComponent {...commonProps}>{children}</CustomComponent>;
  } else if (to) {
    // Внутренняя ссылка с react-router
    return (
      <Link to={to} {...commonProps}>
        {children}
      </Link>
    );
  } else if (href) {
    // Внешняя ссылка
    return (
      <a href={href} {...commonProps}>
        {children}
      </a>
    );
  } else {
    // Обычная кнопка
    return (
      <button type={type} {...commonProps}>
        {children}
      </button>
    );
  }
};

Button.propTypes = {
  variant: PropTypes.oneOf(["filled", "outline"]),
  size: PropTypes.oneOf(["normal", "big"]),
  theme: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.string,
  to: PropTypes.string,
  href: PropTypes.string,
  as: PropTypes.elementType,
};

export default Button;
