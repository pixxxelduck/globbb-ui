import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Инициализация .env
dotenv.config();

// Получение текущей директории (эквивалент __dirname в CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройки API Figma
const FIGMA_API_TOKEN = process.env.FIGMA_API_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

// Настройки для сохранения файлов
const OUTPUT_DIR = path.join(__dirname, "extracted");
const CSS_OUTPUT_FILENAME = "buttons.css";
const JSON_OUTPUT_FILENAME = "buttons.json";
const THEME_COLORS_FILENAME = "themes.json";

// Шаг 1: Получить структуру документа
async function getFileStructure() {
  console.log(`Получение структуры файла (${FIGMA_FILE_KEY})...`);

  const response = await fetch(
    `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`,
    {
      method: "GET",
      headers: {
        "X-Figma-Token": FIGMA_API_TOKEN,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Ошибка при получении структуры файла: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Шаг 2: Найти страницу Buttons
function findButtonsPage(fileStructure) {
  if (!fileStructure.document || !fileStructure.document.children) {
    return null;
  }

  const buttonsPage = fileStructure.document.children.find(
    (page) => page.name === "Buttons"
  );

  return buttonsPage ? buttonsPage.id : null;
}

// Шаг 3: Получить содержимое страницы Buttons
async function getPageContent(pageId) {
  console.log(`Получение содержимого страницы ${pageId}...`);

  const response = await fetch(
    `https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${pageId}`,
    {
      method: "GET",
      headers: {
        "X-Figma-Token": FIGMA_API_TOKEN,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Ошибка при получении содержимого страницы: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

// Функция для загрузки и парсинга выгрузки цветовой палитры
function loadThemeVariables() {
  const themePath = path.join(OUTPUT_DIR, THEME_COLORS_FILENAME);
  if (!fs.existsSync(themePath)) {
    console.log("Файл с переменными темы не найден:", themePath);
    return {};
  }

  try {
    const themeData = JSON.parse(fs.readFileSync(themePath, "utf8"));
    console.log("Загружены переменные темы из:", themePath);

    // Создаем хеш-таблицу для быстрого поиска по значению rgba
    const colorMap = {};

    for (const groupName in themeData.groups) {
      const group = themeData.groups[groupName];
      for (const colorName in group) {
        const color = group[colorName];
        colorMap[color.rgba] = color.cssVariable;
      }
    }

    console.log(
      `Загружено ${Object.keys(colorMap).length} цветовых переменных.`
    );
    return colorMap;
  } catch (error) {
    console.error("Ошибка при загрузке переменных темы:", error);
    return {};
  }
}

// Функция для поиска переменной CSS по значению цвета
function findColorVariable(rgba, colorMap) {
  return colorMap[rgba] ? `var(${colorMap[rgba]})` : rgba;
}

// Вспомогательная функция для форматирования rem-значений (убираем лишние нули)
function formatRem(value) {
  // Преобразуем строковое значение rem в число
  const numStr = value.toString().replace("rem", "");
  const num = parseFloat(numStr);

  // Форматируем число: убираем десятичные нули (.000 -> 0)
  let formatted = num.toString();
  // Если значение целое (например, 1.0), убираем десятичную часть
  if (num === Math.floor(num)) {
    formatted = Math.floor(num).toString();
  } else {
    // Если десятичная часть заканчивается на 0, убираем их
    formatted = formatted.replace(/(\.\d+?)0+$/, "$1");
    // Если осталась только точка, убираем и её
    formatted = formatted.replace(/\.$/, "");
  }

  return formatted + "rem";
}

// Вспомогательная функция для форматирования объекта padding
function formatPadding(padding) {
  const top = formatRem(padding.top + "rem");
  const right = formatRem(padding.right + "rem");
  const bottom = formatRem(padding.bottom + "rem");
  const left = formatRem(padding.left + "rem");

  // Оптимизируем запись padding
  if (top === right && right === bottom && bottom === left) {
    return top; // padding: 1rem;
  } else if (top === bottom && right === left) {
    return `${top} ${right}`; // padding: 1rem 2rem;
  } else if (right === left) {
    return `${top} ${right} ${bottom}`; // padding: 1rem 2rem 3rem;
  } else {
    return `${top} ${right} ${bottom} ${left}`; // padding: 1rem 2rem 3rem 4rem;
  }
}

// Шаг 4.1: Извлечь цвет фона из ноды
function extractBackgroundColor(node) {
  if (!node || !node.fills || node.fills.length === 0) {
    return null;
  }

  // Ищем сплошную заливку
  const solidFill = node.fills.find((fill) => fill.type === "SOLID");

  if (!solidFill) {
    return null;
  }

  return extractRGBA(solidFill);
}

// Шаг 4.2: Извлечь цвет рамки из ноды
function extractBorderColor(node) {
  if (!node || !node.strokes || node.strokes.length === 0) {
    return null;
  }

  // Ищем сплошную заливку для рамки
  const solidStroke = node.strokes.find((stroke) => stroke.type === "SOLID");

  if (!solidStroke) {
    return null;
  }

  return extractRGBA(solidStroke);
}

// Шаг 4.3: Извлечь цвет текста из узла текста
function extractTextColor(node) {
  if (!node || !node.fills || node.fills.length === 0) {
    return null;
  }

  // Ищем сплошную заливку для текста
  const solidFill = node.fills.find((fill) => fill.type === "SOLID");

  if (!solidFill) {
    return null;
  }

  return extractRGBA(solidFill);
}

// Шаг 4.4: Извлечь данные автолейаута (gap)
function extractLayoutGap(node) {
  if (!node || !node.layoutMode) {
    return 0;
  }

  // Преобразуем px в rem (предполагая базовый размер 16px)
  return ((node.itemSpacing || 0) / 16).toFixed(3);
}

// Шаг 4.5: Извлечь толщину рамки
function extractBorderWidth(node) {
  if (!node || !node.strokeWeight) {
    return 0;
  }

  // Преобразуем px в rem (предполагая базовый размер 16px)
  return (node.strokeWeight / 16).toFixed(3);
}

// Шаг 4.6: Извлечь радиус скругления рамки
function extractBorderRadius(node) {
  if (!node || !node.cornerRadius) {
    return 0;
  }

  // Преобразуем px в rem (предполагая базовый размер 16px)
  return (node.cornerRadius / 16).toFixed(3);
}

// Шаг 4.7: Извлечь отступы (padding)
function extractPadding(node) {
  if (!node || !node.layoutMode) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  // Преобразуем px в rem (предполагая базовый размер 16px)
  return {
    top: ((node.paddingTop || 0) / 16).toFixed(3),
    right: ((node.paddingRight || 0) / 16).toFixed(3),
    bottom: ((node.paddingBottom || 0) / 16).toFixed(3),
    left: ((node.paddingLeft || 0) / 16).toFixed(3),
  };
}

// Шаг 4.8: Извлечь данные о шрифте
function extractFontInfo(textNode) {
  if (!textNode || !textNode.style) {
    return null;
  }

  const { fontFamily, fontWeight, fontSize, lineHeightPx } = textNode.style;

  // Преобразуем размер шрифта из px в rem (предполагая базовый размер 16px)
  const fontSizeRem = (fontSize / 16).toFixed(3);

  // Преобразуем line-height в безразмерную величину
  const lineHeight = lineHeightPx ? (lineHeightPx / fontSize).toFixed(3) : null;

  return {
    fontFamily,
    fontWeight,
    fontSize: `${fontSizeRem}rem`,
    lineHeight: lineHeight ? lineHeight : null,
  };
}

// Шаг 4.9: Извлечь информацию об эффектах
function extractEffects(node) {
  if (!node || !node.effects || node.effects.length === 0) {
    return [];
  }

  const result = [];

  for (const effect of node.effects) {
    if (!effect.visible) continue;

    if (effect.type === "DROP_SHADOW") {
      const { color, offset, radius, spread } = effect;

      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      const a = Math.round(color.a * 100) / 100;

      result.push({
        type: "shadow",
        color: `rgba(${r}, ${g}, ${b}, ${a})`,
        offsetX: offset.x,
        offsetY: offset.y,
        blur: radius,
        spread: spread || 0,
      });
    } else if (effect.type === "INNER_SHADOW") {
      const { color, offset, radius, spread } = effect;

      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      const a = Math.round(color.a * 100) / 100;

      result.push({
        type: "innerShadow",
        color: `rgba(${r}, ${g}, ${b}, ${a})`,
        offsetX: offset.x,
        offsetY: offset.y,
        blur: radius,
        spread: spread || 0,
      });
    } else if (effect.type === "LAYER_BLUR") {
      result.push({
        type: "blur",
        blur: effect.radius,
      });
    }
  }

  return result;
}

// Извлечь цветовое значение
function extractRGBA(fill) {
  if (!fill || !fill.color) {
    return null;
  }

  const r = Math.round(fill.color.r * 255);
  const g = Math.round(fill.color.g * 255);
  const b = Math.round(fill.color.b * 255);

  // Округляем значение прозрачности до 2 знаков после запятой
  let a = fill.opacity !== undefined ? fill.opacity : 1;
  a = Math.round(a * 100) / 100;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Шаг 5: Найти текстовый элемент внутри фрейма
function findTextNode(frameNode) {
  if (!frameNode || !frameNode.children) {
    return null;
  }

  // Ищем первый текстовый элемент (возможно придется адаптировать для более сложных кнопок)
  return frameNode.children.find((child) => child.type === "TEXT");
}

// Шаг 6: Проанализировать структуру страницы Buttons
function parseButtonsStructure(pageContent) {
  if (!pageContent.nodes) {
    throw new Error("Некорректный формат содержимого страницы");
  }

  const pageNode =
    pageContent.nodes[Object.keys(pageContent.nodes)[0]].document;
  const buttonVariants = {};

  // Находим все секции (типы кнопок с цветовыми схемами)
  if (pageNode.children) {
    // Ищем все ноды с типом SECTION и пометкой Ready for dev
    const sections = pageNode.children.filter(
      (node) =>
        node.type === "SECTION" && node.devStatus?.type === "READY_FOR_DEV"
    );

    if (sections.length === 0) {
      throw new Error(
        'На странице Buttons не найдено ни одной секции с пометкой "Ready for dev"'
      );
    }

    console.log(`Найдено ${sections.length} секций (компонентов кнопок)`);

    // Обрабатываем каждую секцию
    for (const section of sections) {
      // Получаем имя секции в формате вариант_кнопки/название_цветовой_схемы
      const [buttonVariant, colorScheme] = section.name
        .split("/")
        .map((part) => part.trim());

      // Создаем структуру для хранения данных о кнопке, если её еще нет
      if (!buttonVariants[buttonVariant]) {
        buttonVariants[buttonVariant] = {
          themes: {},
          modifiers: {},
        };
      }

      // Создаем структуру для текущей цветовой схемы
      buttonVariants[buttonVariant].themes[colorScheme] = {
        states: {},
      };

      // Обработка фреймов внутри секции (состояния кнопки)
      if (section.children) {
        const frames = section.children.filter((node) => node.type === "FRAME");

        for (const frame of frames) {
          // Получаем имя фрейма в формате название_состояния_кнопки/название_модификатора_кнопки
          const frameParts = frame.name.split("/").map((part) => part.trim());
          let state, modifier;

          // Убираем подробный лог обработки каждого фрейма
          // console.log(`Обрабатываем фрейм: ${frame.name}`);

          if (frameParts.length > 1) {
            // Формат имени: состояние/модификатор
            state = frameParts[0];
            modifier = frameParts[1];

            // console.log(`  Состояние: ${state}, Модификатор: ${modifier}`);
          } else {
            // Формат имени: только состояние (базовая кнопка)
            state = frameParts[0];
            modifier = null; // Не указываем модификатор, это базовая версия

            // console.log(`  Состояние: ${state} (базовая кнопка)`);
          }

          // Находим текстовый элемент внутри фрейма
          const textNode = findTextNode(frame);

          // Извлекаем все необходимые характеристики
          const buttonProps = {
            backgroundColor: extractBackgroundColor(frame),
            borderColor: extractBorderColor(frame),
            textColor: textNode ? extractTextColor(textNode) : null,
            gap: extractLayoutGap(frame),
            borderWidth: extractBorderWidth(frame),
            borderRadius: extractBorderRadius(frame),
            padding: extractPadding(frame),
            font: textNode ? extractFontInfo(textNode) : null,
            effects: extractEffects(frame),
          };

          if (modifier) {
            // Это кнопка с модификатором (например, hover/big)

            // Создаем структуру для модификатора, если её еще нет
            if (!buttonVariants[buttonVariant].modifiers[modifier]) {
              buttonVariants[buttonVariant].modifiers[modifier] = {};
            }

            // Создаем структуру для темы внутри модификатора, если её еще нет
            if (
              !buttonVariants[buttonVariant].modifiers[modifier][colorScheme]
            ) {
              buttonVariants[buttonVariant].modifiers[modifier][colorScheme] = {
                states: {},
              };
            }

            // Записываем характеристики для модификатора
            buttonVariants[buttonVariant].modifiers[modifier][
              colorScheme
            ].states[state] = buttonProps;
          } else {
            // Это базовая кнопка (без явного модификатора)

            // Записываем характеристики для базовой кнопки
            buttonVariants[buttonVariant].themes[colorScheme].states[state] =
              buttonProps;

            // Также добавляем базовую кнопку как модификатор "normal" для последовательности
            if (!buttonVariants[buttonVariant].modifiers.normal) {
              buttonVariants[buttonVariant].modifiers.normal = {};
            }

            if (!buttonVariants[buttonVariant].modifiers.normal[colorScheme]) {
              buttonVariants[buttonVariant].modifiers.normal[colorScheme] = {
                states: {},
              };
            }

            // Создаем глубокую копию объекта, чтобы не было связи через ссылку
            const normalModProps = JSON.parse(JSON.stringify(buttonProps));
            buttonVariants[buttonVariant].modifiers.normal[colorScheme].states[
              state
            ] = normalModProps;
          }
        }
      }
    }
  }

  return buttonVariants;
}

// Функция для выявления всех отличий между базовым состоянием и модификатором
function extractDifferences(baseState, modState) {
  let cssContent = "";
  let hasDifferences = false;

  // Сравниваем и добавляем свойства, только если они отличаются

  // 1. Простые свойства (не объекты)
  const simpleProps = {
    "border-radius":
      modState.borderRadius !== undefined
        ? modState.borderRadius + "rem"
        : undefined,
    "border-width":
      modState.borderWidth !== undefined
        ? modState.borderWidth + "rem"
        : undefined,
    gap: modState.gap !== undefined ? modState.gap + "rem" : undefined,
  };

  for (const [cssName, value] of Object.entries(simpleProps)) {
    if (value !== undefined) {
      // Получаем соответствующее свойство из baseState
      let baseProp;
      switch (cssName) {
        case "border-radius":
          baseProp = baseState.borderRadius + "rem";
          break;
        case "border-width":
          baseProp = baseState.borderWidth + "rem";
          break;
        case "gap":
          baseProp = baseState.gap + "rem";
          break;
      }

      // Сравниваем числовые значения после преобразования в числа (чтобы избежать проблем с форматированием)
      const baseValue = parseFloat(baseProp);
      const modValue = parseFloat(value);

      if (
        !isNaN(baseValue) &&
        !isNaN(modValue) &&
        Math.abs(baseValue - modValue) > 0.0001
      ) {
        cssContent += `  ${cssName}: ${formatRem(value)};\n`;
        hasDifferences = true;
      }
    }
  }

  // 2. Сравниваем отступы (padding)
  if (modState.padding && baseState.padding) {
    const basePadding = baseState.padding;
    const modPadding = modState.padding;

    // Проверяем каждое значение отдельно
    const paddingDiff =
      Math.abs(parseFloat(basePadding.top) - parseFloat(modPadding.top)) >
        0.0001 ||
      Math.abs(parseFloat(basePadding.right) - parseFloat(modPadding.right)) >
        0.0001 ||
      Math.abs(parseFloat(basePadding.bottom) - parseFloat(modPadding.bottom)) >
        0.0001 ||
      Math.abs(parseFloat(basePadding.left) - parseFloat(modPadding.left)) >
        0.0001;

    if (paddingDiff) {
      cssContent += `  padding: ${formatPadding(modPadding)};\n`;
      hasDifferences = true;
    }
  }

  // 3. Сравниваем свойства шрифта
  if (modState.font && baseState.font) {
    // Сравниваем fontFamily
    if (modState.font.fontFamily !== baseState.font.fontFamily) {
      cssContent += `  font-family: ${modState.font.fontFamily};\n`;
      hasDifferences = true;
      // Убираем лог об отличии
      // console.log(
      //   `Обнаружено отличие в font-family: ${baseState.font.fontFamily} -> ${modState.font.fontFamily}`
      // );
    }

    // Сравниваем fontWeight
    if (modState.font.fontWeight !== baseState.font.fontWeight) {
      cssContent += `  font-weight: ${modState.font.fontWeight};\n`;
      hasDifferences = true;
      // Убираем лог об отличии
      // console.log(
      //   `Обнаружено отличие в font-weight: ${baseState.font.fontWeight} -> ${modState.font.fontWeight}`
      // );
    }

    // Сравниваем fontSize (как числа, чтобы избежать проблем с форматированием)
    const baseFontSize = parseFloat(baseState.font.fontSize.replace("rem", ""));
    const modFontSize = parseFloat(modState.font.fontSize.replace("rem", ""));

    if (
      !isNaN(baseFontSize) &&
      !isNaN(modFontSize) &&
      Math.abs(baseFontSize - modFontSize) > 0.0001
    ) {
      cssContent += `  font-size: ${formatRem(modState.font.fontSize)};\n`;
      hasDifferences = true;
      // Убираем лог об отличии
      // console.log(
      //   `Обнаружено отличие в font-size: ${baseState.font.fontSize} -> ${modState.font.fontSize}`
      // );
    }

    // Сравниваем lineHeight (как числа)
    const baseLineHeight = parseFloat(baseState.font.lineHeight);
    const modLineHeight = parseFloat(modState.font.lineHeight);

    if (
      !isNaN(baseLineHeight) &&
      !isNaN(modLineHeight) &&
      Math.abs(baseLineHeight - modLineHeight) > 0.0001
    ) {
      const lineHeight =
        typeof modState.font.lineHeight === "string"
          ? modState.font.lineHeight.replace(/(\d+\.\d+)/, (m) =>
              parseFloat(m).toString()
            )
          : modState.font.lineHeight;
      cssContent += `  line-height: ${lineHeight};\n`;
      hasDifferences = true;
      // Убираем лог об отличии
      // console.log(
      //   `Обнаружено отличие в line-height: ${baseState.font.lineHeight} -> ${modState.font.lineHeight}`
      // );
    }
  }

  return { cssContent, hasDifferences };
}

// Функция для определения, влияет ли модификатор на цветовые свойства
function hasColorDifferences(baseState, modState) {
  // Проверяем различия в цветах
  const bgDiff = modState.backgroundColor !== baseState.backgroundColor;
  const borderDiff = modState.borderColor !== baseState.borderColor;
  const textDiff = modState.textColor !== baseState.textColor;

  const hasDifference = bgDiff || borderDiff || textDiff;

  return hasDifference;
}

// Шаг 7: Преобразовать данные о кнопках в CSS
function generateCSS(buttonVariants) {
  let cssContent = "";

  // Загружаем переменные цветов из палитры
  const colorVariables = loadThemeVariables();

  for (const buttonVariant in buttonVariants) {
    const variantData = buttonVariants[buttonVariant];

    // Определяем основное состояние для кнопки
    let baseState = null;

    // Ищем состояние default в первой теме
    const firstTheme = variantData.themes[Object.keys(variantData.themes)[0]];
    if (firstTheme && firstTheme.states) {
      baseState = firstTheme.states.default || firstTheme.states.normal;
    }

    if (!baseState) {
      console.warn(`Не найдено базовое состояние для кнопки ${buttonVariant}`);
      continue;
    }

    // =================== БАЗОВЫЕ СТИЛИ КНОПКИ ===================
    cssContent += `.${buttonVariant} {\n`;

    // Базовые стили кнопки
    if (baseState.backgroundColor) {
      const bgColor = findColorVariable(
        baseState.backgroundColor,
        colorVariables
      );
      cssContent += `  background-color: ${bgColor};\n`;
    }

    if (baseState.borderColor) {
      const borderColor = findColorVariable(
        baseState.borderColor,
        colorVariables
      );
      cssContent += `  border-color: ${borderColor};\n`;
    }

    if (baseState.borderWidth) {
      cssContent += `  border-width: ${formatRem(
        baseState.borderWidth + "rem"
      )};\n`;
    }

    if (baseState.borderRadius) {
      cssContent += `  border-radius: ${formatRem(
        baseState.borderRadius + "rem"
      )};\n`;
    }

    // Граница должна быть стилем solid
    cssContent += `  border-style: solid;\n`;

    const padding = baseState.padding;
    cssContent += `  padding: ${formatPadding(padding)};\n`;

    // Добавляем свойства для флекс-бокса
    cssContent += `  display: inline-flex;\n`;
    cssContent += `  align-items: center;\n`;
    cssContent += `  justify-content: center;\n`;

    if (baseState.gap) {
      cssContent += `  gap: ${formatRem(baseState.gap + "rem")};\n`;
    }

    // Стили текста
    if (baseState.font) {
      const font = baseState.font;
      if (font.fontFamily) cssContent += `  font-family: ${font.fontFamily};\n`;
      if (font.fontWeight) cssContent += `  font-weight: ${font.fontWeight};\n`;

      if (font.fontSize) {
        // Форматируем размер шрифта, убирая лишние нули
        cssContent += `  font-size: ${formatRem(font.fontSize)};\n`;
      }

      if (font.lineHeight) {
        // Форматируем line-height, убирая лишние нули при необходимости
        const lineHeight =
          typeof font.lineHeight === "string"
            ? font.lineHeight.replace(/(\d+\.\d+)/, (m) =>
                parseFloat(m).toString()
              )
            : font.lineHeight;
        cssContent += `  line-height: ${lineHeight};\n`;
      }
    }

    if (baseState.textColor) {
      const textColor = findColorVariable(baseState.textColor, colorVariables);
      cssContent += `  color: ${textColor};\n`;
    }

    // Эффекты
    if (baseState.effects && baseState.effects.length > 0) {
      cssContent += generateEffectsCSS(baseState.effects, colorVariables);
    }

    // Добавляем переход для плавного изменения при hover и active
    cssContent += `  transition: all 0.2s ease-in-out;\n`;
    cssContent += `}\n\n`;

    // =================== СОСТОЯНИЯ ОСНОВНОЙ КНОПКИ ===================
    // Обрабатываем все темы
    for (const themeName in variantData.themes) {
      const theme = variantData.themes[themeName];

      // Для каждой темы обрабатываем все состояния
      for (const stateName in theme.states) {
        const state = theme.states[stateName];

        // Пропускаем базовое состояние для основной темы, так как оно уже обработано
        if (
          stateName === "default" &&
          themeName === Object.keys(variantData.themes)[0]
        ) {
          continue;
        }

        let selector = `.${buttonVariant}`;

        // Добавляем атрибут темы, если это не первая тема
        if (themeName !== Object.keys(variantData.themes)[0]) {
          selector += `[theme="${themeName}"]`;
        }

        // Добавляем псевдокласс для состояния, если это не default
        if (stateName !== "default") {
          selector += `:${stateName}`;
        }

        cssContent += `${selector} {\n`;

        // Добавляем стили для текущего состояния
        cssContent += generateStateCSS(state, colorVariables);

        cssContent += `}\n\n`;
      }
    }

    // =================== МОДИФИКАТОРЫ КНОПКИ ===================
    // CSS для модификаторов
    if (variantData.modifiers) {
      for (const modifierName in variantData.modifiers) {
        // Пропускаем модификатор "normal", т.к. он идентичен базовой кнопке
        if (modifierName === "normal") continue;

        const modifierData = variantData.modifiers[modifierName];

        // Получаем базовое состояние модификатора
        let baseModState = null;

        // Ищем базовое состояние в первой теме модификатора
        const firstModTheme = modifierData[Object.keys(modifierData)[0]];
        if (firstModTheme && firstModTheme.states) {
          baseModState =
            firstModTheme.states.default || firstModTheme.states.normal;
        }

        if (baseModState) {
          // Извлекаем различия между базовым состоянием и модификатором
          const { cssContent: modDiff, hasDifferences } = extractDifferences(
            baseState,
            baseModState
          );

          // Если есть отличия, генерируем CSS для модификатора
          if (hasDifferences) {
            cssContent += `.${buttonVariant}[mod="${modifierName}"] {\n`;
            cssContent += modDiff;
            cssContent += `}\n\n`;
          }

          // Проверяем, влияет ли модификатор на цвет
          const affectsColors = hasColorDifferences(baseState, baseModState);

          // Если модификатор влияет на цвет, генерируем CSS для всех его состояний и тем
          if (affectsColors) {
            // Для каждой темы и состояния генерируем правила с цветами
            for (const themeName in modifierData) {
              const theme = modifierData[themeName];

              for (const stateName in theme.states) {
                // Пропускаем default состояние для первой темы, которое уже учтено
                if (
                  stateName === "default" &&
                  themeName === Object.keys(modifierData)[0]
                )
                  continue;

                const stateData = theme.states[stateName];

                // Строим селектор
                let selector = `.${buttonVariant}[mod="${modifierName}"]`;

                // Добавляем тему, если это не первая тема
                if (themeName !== Object.keys(variantData.themes)[0]) {
                  selector += `[theme="${themeName}"]`;
                }

                // Добавляем псевдокласс состояния для не-default состояний
                if (stateName !== "default") {
                  selector += `:${stateName}`;
                }

                cssContent += `${selector} {\n`;
                cssContent += generateStateCSS(stateData, colorVariables);
                cssContent += `}\n\n`;
              }
            }
          }
        }
      }
    }
  }

  return cssContent;
}

// Функция для генерации CSS для эффектов
function generateEffectsCSS(effects, colorVariables) {
  let cssContent = "";

  let shadowsCSS = [];
  let filtersCSS = [];

  for (const effect of effects) {
    if (effect.type === "shadow") {
      const shadowColor = findColorVariable(effect.color, colorVariables);
      shadowsCSS.push(
        `${formatRem(effect.offsetX / 16 + "rem")} ${formatRem(
          effect.offsetY / 16 + "rem"
        )} ${formatRem(effect.blur / 16 + "rem")} ${formatRem(
          effect.spread / 16 + "rem"
        )} ${shadowColor}`
      );
    } else if (effect.type === "innerShadow") {
      const shadowColor = findColorVariable(effect.color, colorVariables);
      shadowsCSS.push(
        `inset ${formatRem(effect.offsetX / 16 + "rem")} ${formatRem(
          effect.offsetY / 16 + "rem"
        )} ${formatRem(effect.blur / 16 + "rem")} ${formatRem(
          effect.spread / 16 + "rem"
        )} ${shadowColor}`
      );
    } else if (effect.type === "blur") {
      filtersCSS.push(`blur(${formatRem(effect.blur / 16 + "rem")})`);
    }
  }

  if (shadowsCSS.length > 0) {
    cssContent += `  box-shadow: ${shadowsCSS.join(", ")};\n`;
  }

  if (filtersCSS.length > 0) {
    cssContent += `  filter: ${filtersCSS.join(" ")};\n`;
  }

  return cssContent;
}

// Функция для генерации CSS для состояния
function generateStateCSS(state, colorVariables) {
  let cssContent = "";

  // Добавляем стили для текущего состояния
  if (state.backgroundColor) {
    const bgColor = findColorVariable(state.backgroundColor, colorVariables);
    cssContent += `  background-color: ${bgColor};\n`;
  }

  if (state.borderColor) {
    const borderColor = findColorVariable(state.borderColor, colorVariables);
    cssContent += `  border-color: ${borderColor};\n`;
  }

  if (state.textColor) {
    const textColor = findColorVariable(state.textColor, colorVariables);
    cssContent += `  color: ${textColor};\n`;
  }

  // Эффекты
  if (state.effects && state.effects.length > 0) {
    cssContent += generateEffectsCSS(state.effects, colorVariables);
  }

  return cssContent;
}

// Шаг 8: Сохранить CSS файл
function saveToCSSFile(cssContent) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filePath = path.join(OUTPUT_DIR, CSS_OUTPUT_FILENAME);
  fs.writeFileSync(filePath, cssContent);
  console.log(`CSS стили сохранены в ${filePath}`);
}

// Шаг 9: Сохранить JSON файл
function saveToJSONFile(jsonData) {
  const filePath = path.join(OUTPUT_DIR, JSON_OUTPUT_FILENAME);
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  console.log(`JSON структура сохранена в ${filePath}`);
}

// Основная функция
async function main() {
  try {
    // Создаем директорию для вывода файлов, если её еще нет
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`Создана директория для вывода: ${OUTPUT_DIR}`);
    }

    // Проверка на наличие файла для отладки
    const jsonFilePath = path.join(OUTPUT_DIR, JSON_OUTPUT_FILENAME);
    let buttonVariants;

    // Проверяем, существует ли JSON файл для отладки
    if (fs.existsSync(jsonFilePath)) {
      console.log(`Найден файл JSON для отладки: ${jsonFilePath}`);
      try {
        buttonVariants = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
        console.log("Данные успешно загружены из JSON файла");
      } catch (jsonError) {
        console.error("Ошибка при парсинге JSON файла для отладки:", jsonError);
        console.log("Продолжаем обычную загрузку из Figma...");
        buttonVariants = await loadDataFromFigma();
      }
    } else {
      // Обычная загрузка из Figma
      buttonVariants = await loadDataFromFigma();
    }

    // Проверяем наличие файла с цветовыми переменными темы
    const themeColorsPath = path.join(OUTPUT_DIR, THEME_COLORS_FILENAME);
    if (!fs.existsSync(themeColorsPath)) {
      console.log(
        `Внимание: файл с цветовыми переменными темы не найден: ${themeColorsPath}`
      );
      console.log("CSS будет сгенерирован без использования переменных цвета.");
    } else {
      console.log(
        `Найден файл с цветовыми переменными темы: ${themeColorsPath}`
      );
    }

    // Генерируем CSS стили
    const cssContent = generateCSS(buttonVariants);

    // Сохраняем результат в CSS файл
    saveToCSSFile(cssContent);

    // Сохраняем JSON структуру (если она была загружена из Figma)
    if (!fs.existsSync(jsonFilePath) && buttonVariants) {
      saveToJSONFile(buttonVariants);
    }

    // Выводим статистику с учетом только уникальных состояний
    let totalVariants = Object.keys(buttonVariants).length;
    let totalThemes = 0;
    let uniqueStates = new Set(); // Для подсчета уникальных состояний
    let totalCombinations = 0; // Общее количество комбинаций вариант-тема-состояние
    let uniqueModifiers = new Set(); // Для подсчета уникальных модификаторов
    let totalModifiers = 0; // Общее количество модификаторов

    for (const variantName in buttonVariants) {
      const variant = buttonVariants[variantName];
      const themeCount = Object.keys(variant.themes).length;
      totalThemes += themeCount;

      // Подсчет уникальных состояний для каждой кнопки
      const variantUniqueStates = new Set();

      // Подсчет модификаторов для каждой кнопки
      const modifierCount = Object.keys(variant.modifiers).length;
      totalModifiers += modifierCount;

      // Добавляем уникальные модификаторы в общий набор
      Object.keys(variant.modifiers).forEach((modName) => {
        uniqueModifiers.add(modName);
      });

      for (const themeName in variant.themes) {
        const stateCount = Object.keys(variant.themes[themeName].states).length;
        totalCombinations += stateCount;

        // Добавляем имена состояний в оба набора (для варианта кнопки и общий)
        Object.keys(variant.themes[themeName].states).forEach((stateName) => {
          variantUniqueStates.add(stateName);
          uniqueStates.add(stateName);
        });
      }

      const variantStateCount = variantUniqueStates.size;

      console.log(
        `Вариант кнопки '${variantName}': ${themeCount} цветовых схем, ${modifierCount} модификаторов, ${variantStateCount} уникальных состояний`
      );
    }

    console.log(
      `Всего вариантов: ${totalVariants}, цветовых схем: ${totalThemes}, модификаторов: ${uniqueModifiers.size} (${totalModifiers} с повторами), уникальных состояний: ${uniqueStates.size}`
    );
    console.log(
      `Всего комбинаций вариант-тема-состояние: ${totalCombinations}`
    );
    console.log(
      `CSS файл сохранен в: ${path.join(OUTPUT_DIR, CSS_OUTPUT_FILENAME)}`
    );
  } catch (error) {
    console.error("Произошла ошибка:", error);
  }
}

// Функция для загрузки данных из Figma
async function loadDataFromFigma() {
  // 1. Получаем структуру файла
  const fileStructure = await getFileStructure();
  console.log(`Документ: ${fileStructure.name}`);

  // 2. Находим страницу Buttons
  const buttonsPageId = findButtonsPage(fileStructure);
  if (!buttonsPageId) {
    throw new Error("Страница Buttons не найдена в документе");
  }
  console.log(`Найдена страница Buttons: ${buttonsPageId}`);

  // 3. Получаем содержимое страницы
  const pageContent = await getPageContent(buttonsPageId);

  // 4. Анализируем структуру и извлекаем данные о кнопках
  return parseButtonsStructure(pageContent);
}

// Запуск скрипта
main();
