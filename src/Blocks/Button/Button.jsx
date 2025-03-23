import React from "react";
import { Link } from "react-router-dom";
import generateStyle from "./generateStyle.util";
import styles from "./Button.module.css";

/**
 * Универсальный компонент кнопки с поддержкой рендеринга в виде ссылки
 *
 * @param {Object} props - свойства компонента
 * @param {string} [props.variant='primary'] - вариант кнопки ('primary', 'secondary')
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
  variant = "primary",
  size = "normal",
  theme = "ash-gray",
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
  // Определяем стилевые переменные для кнопки на основе темы и варианта
  const buttonStyle = generateStyle(theme, variant);

  // Определяем основной класс в зависимости от варианта и размера
  const buttonClasses = [
    styles.base,
    variant === "secondary" ? styles.secondary : styles.primary,
    size === "big" ? styles.big : "",
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

export default Button;
