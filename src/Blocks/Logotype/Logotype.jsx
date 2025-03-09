import React from "react";
import themeColors from "./colors.json";

/**
 * Компонент логотипа с поддержкой цветовых тем и их оттенков
 * @param {Object} props - Свойства компонента
 * @param {string} [props.theme='ash-gray'] - Цветовая тема логотипа (ash-gray, cadet-blue, pastel-blue, pewter-blue, baby-blue, sage, fawn, parrot-pink, kobi, sandy)
 * @param {string} [props.variant='dark'] - Вариант цвета (primary, primary-50, primary-25, dark, dark-85, dark-80, dark-50)
 * @param {number} [props.width=172] - Ширина логотипа
 * @param {number} [props.height=26] - Высота логотипа
 * @param {string} [props.className] - CSS класс для дополнительных стилей
 * @returns {JSX.Element} SVG логотипа
 */
const Logotype = ({
  theme = "ash-gray",
  variant = "dark",
  width = 172,
  height = 26,
  className = "",
}) => {
  // Получаем цвет для текущей темы и варианта или используем значение по умолчанию
  const fillColor =
    themeColors[theme] && themeColors[theme][variant]
      ? themeColors[theme][variant]
      : themeColors["ash-gray"]["dark"];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 172 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M169.368 2.41177V4.52942H171.486V10.8824H169.368V13H171.486V21.4706H169.368V23.5882H167.251V25.7059H148.192V23.5882H146.074V2.41177H148.192V6.64707H150.31V4.52942H152.427V2.41177H148.192V0.294128H167.251V2.41177H169.368ZM165.133 17.2353V15.1177H158.78V17.2353H165.133ZM158.78 8.76472H165.133V6.64707H158.78V8.76472Z"
        fill={fillColor}
      />
      <path
        d="M139.732 2.41177V4.52942H141.849V10.8824H139.732V13H141.849V21.4706H139.732V23.5882H137.614V25.7059H118.555V23.5882H116.438V2.41177H118.555V6.64707H120.673V4.52942H122.79V2.41177H118.555V0.294128H137.614V2.41177H139.732ZM135.496 17.2353V15.1177H129.143V17.2353H135.496ZM129.143 8.76472H135.496V6.64707H129.143V8.76472Z"
        fill={fillColor}
      />
      <path
        d="M110.095 2.41177V4.52942H112.213V10.8824H110.095V13H112.213V21.4706H110.095V23.5882H107.977V25.7059H88.9184V23.5882H86.8008V2.41177H88.9184V6.64707H91.0361V4.52942H93.1537V2.41177H88.9184V0.294128H107.977V2.41177H110.095ZM105.86 17.2353V15.1177H99.5067V17.2353H105.86ZM99.5067 8.76472H105.86V6.64707H99.5067V8.76472Z"
        fill={fillColor}
      />
      <path
        d="M80.4582 2.41177V4.52942H82.5758V21.4706H80.4582V23.5882H78.3405V25.7059H61.3994V23.5882H59.2817V21.4706H57.1641V4.52942H59.2817V6.64707H61.3994V4.52942H63.517V2.41177H61.3994V0.294128H78.3405V2.41177H80.4582ZM76.2229 17.2353V6.64707H69.8699V17.2353H76.2229Z"
        fill={fillColor}
      />
      <path
        d="M50.8132 17.2353V19.353H52.9308V23.5882H50.8132V25.7059H31.7544V23.5882H29.6367V2.41177H31.7544V6.64707H33.872V4.52942H35.9897V2.41177H31.7544V0.294128H40.225V2.41177H42.3426V17.2353H50.8132Z"
        fill={fillColor}
      />
      <path
        d="M23.2941 0.294128V2.41177H25.4118V4.52942H23.2941V6.64707H12.7059V17.2353H19.0588V15.1177H16.9412V13H14.8235V10.8824H16.9412V8.76472H23.2941V10.8824H25.4118V21.4706H23.2941V23.5882H21.1765V25.7059H4.23529V23.5882H2.11765V21.4706H0V4.52942H2.11765V6.64707H4.23529V4.52942H6.35294V2.41177H4.23529V0.294128H23.2941Z"
        fill={fillColor}
      />
    </svg>
  );
};

export default Logotype;
