import React from "react";
import { THEMES } from "../../constants/themes";

/**
 * Компонент с поддержкой цветовых тем и их оттенков
 * @param {Object} props - Свойства компонента
 * @param {string} [props.theme='ash-gray'] - Цветовая тема  (ash-gray, cadet-blue, pastel-blue, pewter-blue, baby-blue, sage, fawn, parrot-pink, kobi, sandy)
 * @param {string} [props.variant='dark'] - Вариант цвета (primary, primary-50, primary-25, dark, dark-85, dark-80, dark-50)
 * @param {number} [props.width=172] - Ширина
 * @param {number} [props.height=26] - Высота
 * @param {string} [props.className] - CSS класс для дополнительных стилей
 * @param {number} [props.opacity=1] - Прозрачность (от 0 до 1)
 * @returns {JSX.Element} SVG
 */
const Preloader = ({
  theme = "ash-gray",
  variant = "dark",
  width = 300,
  height = 150,
  className = "",
  opacity = 1,
}) => {
  const fillColor =
    THEMES[theme] && THEMES[theme][variant]
      ? THEMES[theme][variant]
      : THEMES["ash-gray"]["dark"];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 300 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      // style={{ border: "1px solid red" }}
    >
      <path
        fill="none"
        stroke={fillColor}
        strokeWidth="25"
        strokeLinecap="round"
        strokeDasharray="300 385"
        strokeDashoffset="0"
        d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"
      >
        <animate
          attributeName="stroke-dashoffset"
          calcMode="spline"
          dur="2"
          values="685;-685"
          keySplines="0 0 1 1"
          repeatCount="indefinite"
        ></animate>
      </path>
    </svg>
  );
};

export default Preloader;
