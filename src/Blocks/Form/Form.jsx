// src/components/UI/Form/Form.jsx
import React from "react";
import PropTypes from "prop-types";
import { THEMES, DEFAULT_THEME } from "../../constants/themes";
import styles from "./Form.module.css";

/**
 * Компонент формы с поддержкой тем через CSS-переменные
 *
 * @param {Object} props - свойства компонента
 * @param {string} [props.theme='ash-gray'] - цветовая тема формы
 * @param {React.ReactNode} props.children - содержимое формы
 * @param {function} [props.onSubmit] - обработчик отправки формы
 * @param {string} [props.className] - дополнительные CSS классы
 */
const Form = ({
  theme = DEFAULT_THEME,
  children,
  onSubmit,
  className = "",
  ...rest
}) => {
  // Проверяем существование темы
  const actualTheme = THEMES[theme] ? theme : DEFAULT_THEME;

  // Создаем CSS-переменные для текущей темы
  const formStyle = {
    // Текст заголовков
    "--form-heading-color": `var(--theme-${actualTheme}-dark-80)`,

    // Текст параграфов и ссылок
    "--form-text-color": `var(--theme-${actualTheme}-dark-50)`,

    // Стили для полей ввода
    "--form-input-border": `var(--theme-${actualTheme}-light)`,
    "--form-input-color": `var(--theme-${actualTheme}-dark-80)`,
    "--form-input-placeholder": `var(--theme-${actualTheme}-light)`,
    "--form-input-focus-border": `var(--theme-${actualTheme}-dark-80)`,
  };

  const formClasses = [styles.Form, className].filter(Boolean).join(" ");

  return (
    <form
      className={formClasses}
      style={formStyle}
      onSubmit={onSubmit}
      {...rest}
    >
      {children}
    </form>
  );
};

// Компонент для группы кнопок в форме
const Group = ({ children, className = "", ...rest }) => {
  const groupClasses = [styles.Group, className].filter(Boolean).join(" ");

  return (
    <div className={groupClasses} {...rest}>
      {children}
    </div>
  );
};

// Компонент для поля ввода в форме
const Field = ({ children, className = "", ...rest }) => {
  const fieldClasses = [styles.Field, className].filter(Boolean).join(" ");

  return (
    <div className={fieldClasses} {...rest}>
      {children}
    </div>
  );
};

Form.Group = Group;
Form.Field = Field;

Form.propTypes = {
  theme: PropTypes.string,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  className: PropTypes.string,
};

Group.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Field.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Form;
