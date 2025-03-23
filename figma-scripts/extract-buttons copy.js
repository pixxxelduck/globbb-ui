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
const CSS_OUTPUT_FILENAME = "button-styles.css";
const JSON_OUTPUT_FILENAME = "button-styles.json";

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

// Шаг 4: Извлечь цветовое значение
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
    // Ищем все ноды с типом SECTION
    const sections = pageNode.children.filter(
      (node) => node.type === "SECTION"
    );

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
          const [state, modifier = "normal"] = frame.name
            .split("/")
            .map((part) => part.trim());

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

          // Если это модификатор, добавляем его характеристики
          if (!buttonVariants[buttonVariant].modifiers) {
            buttonVariants[buttonVariant].modifiers = {};
          }

          if (modifier !== "normal") {
            if (!buttonVariants[buttonVariant].modifiers[modifier]) {
              buttonVariants[buttonVariant].modifiers[modifier] = {};
            }
            // Записываем характеристики для модификатора
            buttonVariants[buttonVariant].modifiers[modifier][state] =
              buttonProps;
          }

          // Записываем характеристики для состояния и цветовой схемы
          buttonVariants[buttonVariant].themes[colorScheme].states[state] =
            buttonProps;

          console.log(
            `Извлечены характеристики для ${buttonVariant} (тема: ${colorScheme}, состояние: ${state}, модификатор: ${modifier})`
          );
        }
      }
    }
  }

  return buttonVariants;
}

// Функция для использования содержимого JSON файла (для отладки)
function parseJsonButtonData(jsonData) {
  return jsonData;
}

// Шаг 7: Преобразовать данные о кнопках в CSS
function generateCSS(buttonVariants) {
  let cssContent = "";

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

    // CSS для основного варианта кнопки
    cssContent += `.${buttonVariant} {\n`;

    // Базовые стили кнопки
    if (baseState.backgroundColor)
      cssContent += `  background-color: ${baseState.backgroundColor};\n`;
    if (baseState.borderColor)
      cssContent += `  border-color: ${baseState.borderColor};\n`;
    if (baseState.borderWidth)
      cssContent += `  border-width: ${baseState.borderWidth}rem;\n`;
    if (baseState.borderRadius)
      cssContent += `  border-radius: ${baseState.borderRadius}rem;\n`;

    // Граница должна быть стилем solid
    cssContent += `  border-style: solid;\n`;

    const padding = baseState.padding;
    cssContent += `  padding: ${padding.top}rem ${padding.right}rem ${padding.bottom}rem ${padding.left}rem;\n`;

    // Добавляем свойства для флекс-бокса
    cssContent += `  display: inline-flex;\n`;
    cssContent += `  align-items: center;\n`;
    cssContent += `  justify-content: center;\n`;

    if (baseState.gap) cssContent += `  gap: ${baseState.gap}rem;\n`;

    // Стили текста
    if (baseState.font) {
      const font = baseState.font;
      if (font.fontFamily) cssContent += `  font-family: ${font.fontFamily};\n`;
      if (font.fontWeight) cssContent += `  font-weight: ${font.fontWeight};\n`;
      if (font.fontSize) cssContent += `  font-size: ${font.fontSize};\n`;
      if (font.lineHeight) cssContent += `  line-height: ${font.lineHeight};\n`;
    }

    if (baseState.textColor) cssContent += `  color: ${baseState.textColor};\n`;

    // Эффекты
    if (baseState.effects && baseState.effects.length > 0) {
      let shadowsCSS = [];
      let filtersCSS = [];

      for (const effect of baseState.effects) {
        if (effect.type === "shadow") {
          shadowsCSS.push(
            `${effect.offsetX / 16}rem ${effect.offsetY / 16}rem ${
              effect.blur / 16
            }rem ${effect.spread / 16}rem ${effect.color}`
          );
        } else if (effect.type === "innerShadow") {
          shadowsCSS.push(
            `inset ${effect.offsetX / 16}rem ${effect.offsetY / 16}rem ${
              effect.blur / 16
            }rem ${effect.spread / 16}rem ${effect.color}`
          );
        } else if (effect.type === "blur") {
          filtersCSS.push(`blur(${effect.blur / 16}rem)`);
        }
      }

      if (shadowsCSS.length > 0) {
        cssContent += `  box-shadow: ${shadowsCSS.join(", ")};\n`;
      }

      if (filtersCSS.length > 0) {
        cssContent += `  filter: ${filtersCSS.join(" ")};\n`;
      }
    }

    // Добавляем переход для плавного изменения при hover и active
    cssContent += `  transition: all 0.2s ease-in-out;\n`;
    cssContent += `}\n\n`;

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
        if (state.backgroundColor)
          cssContent += `  background-color: ${state.backgroundColor};\n`;
        if (state.borderColor)
          cssContent += `  border-color: ${state.borderColor};\n`;
        if (state.textColor) cssContent += `  color: ${state.textColor};\n`;

        // Эффекты
        if (state.effects && state.effects.length > 0) {
          let shadowsCSS = [];
          let filtersCSS = [];

          for (const effect of state.effects) {
            if (effect.type === "shadow") {
              shadowsCSS.push(
                `${effect.offsetX / 16}rem ${effect.offsetY / 16}rem ${
                  effect.blur / 16
                }rem ${effect.spread / 16}rem ${effect.color}`
              );
            } else if (effect.type === "innerShadow") {
              shadowsCSS.push(
                `inset ${effect.offsetX / 16}rem ${effect.offsetY / 16}rem ${
                  effect.blur / 16
                }rem ${effect.spread / 16}rem ${effect.color}`
              );
            } else if (effect.type === "blur") {
              filtersCSS.push(`blur(${effect.blur / 16}rem)`);
            }
          }

          if (shadowsCSS.length > 0) {
            cssContent += `  box-shadow: ${shadowsCSS.join(", ")};\n`;
          }

          if (filtersCSS.length > 0) {
            cssContent += `  filter: ${filtersCSS.join(" ")};\n`;
          }
        }

        cssContent += `}\n\n`;
      }
    }

    // CSS для модификаторов
    if (variantData.modifiers) {
      for (const modifierName in variantData.modifiers) {
        const modifierStates = variantData.modifiers[modifierName];

        // Используем default состояние если есть, иначе первое доступное
        const baseModState =
          modifierStates.default ||
          modifierStates[Object.keys(modifierStates)[0]];

        if (baseModState) {
          cssContent += `.${buttonVariant}[mod="${modifierName}"] {\n`;

          if (baseModState.borderRadius)
            cssContent += `  border-radius: ${baseModState.borderRadius}rem;\n`;

          const padding = baseModState.padding;
          cssContent += `  padding: ${padding.top}rem ${padding.right}rem ${padding.bottom}rem ${padding.left}rem;\n`;

          if (baseModState.gap)
            cssContent += `  gap: ${baseModState.gap}rem;\n`;

          // Стили текста
          if (baseModState.font) {
            const font = baseModState.font;
            if (font.fontSize) cssContent += `  font-size: ${font.fontSize};\n`;
            if (font.lineHeight)
              cssContent += `  line-height: ${font.lineHeight};\n`;
          }

          cssContent += `}\n\n`;

          // Обрабатываем состояния модификатора
          for (const stateName in modifierStates) {
            if (stateName === "default") continue;

            const stateData = modifierStates[stateName];
            cssContent += `.${buttonVariant}[mod="${modifierName}"]:${stateName} {\n`;

            if (stateData.backgroundColor)
              cssContent += `  background-color: ${stateData.backgroundColor};\n`;
            if (stateData.borderColor)
              cssContent += `  border-color: ${stateData.borderColor};\n`;
            if (stateData.textColor)
              cssContent += `  color: ${stateData.textColor};\n`;

            // Эффекты
            if (stateData.effects && stateData.effects.length > 0) {
              let shadowsCSS = [];
              let filtersCSS = [];

              for (const effect of stateData.effects) {
                if (effect.type === "shadow") {
                  shadowsCSS.push(
                    `${effect.offsetX / 16}rem ${effect.offsetY / 16}rem ${
                      effect.blur / 16
                    }rem ${effect.spread / 16}rem ${effect.color}`
                  );
                } else if (effect.type === "innerShadow") {
                  shadowsCSS.push(
                    `inset ${effect.offsetX / 16}rem ${
                      effect.offsetY / 16
                    }rem ${effect.blur / 16}rem ${effect.spread / 16}rem ${
                      effect.color
                    }`
                  );
                } else if (effect.type === "blur") {
                  filtersCSS.push(`blur(${effect.blur / 16}rem)`);
                }
              }

              if (shadowsCSS.length > 0) {
                cssContent += `  box-shadow: ${shadowsCSS.join(", ")};\n`;
              }

              if (filtersCSS.length > 0) {
                cssContent += `  filter: ${filtersCSS.join(" ")};\n`;
              }
            }

            cssContent += `}\n\n`;
          }
        }
      }
    }
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
    // Проверка на наличие файла для отладки
    const jsonFilePath = path.join(OUTPUT_DIR, JSON_OUTPUT_FILENAME);
    let buttonVariants;

    // Проверяем, существует ли JSON файл для отладки
    if (fs.existsSync(jsonFilePath)) {
      console.log(`Найден файл JSON для отладки: ${jsonFilePath}`);
      try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
        buttonVariants = parseJsonButtonData(jsonData);
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

    // Генерируем CSS стили
    const cssContent = generateCSS(buttonVariants);

    // Сохраняем результат в CSS файл
    saveToCSSFile(cssContent);

    // Сохраняем JSON структуру (если она была загружена из Figma)
    if (!fs.existsSync(jsonFilePath)) {
      saveToJSONFile(buttonVariants);
    }

    // Выводим статистику
    let totalVariants = Object.keys(buttonVariants).length;
    let totalThemes = 0;
    let totalStates = 0;

    for (const variantName in buttonVariants) {
      const variant = buttonVariants[variantName];
      const themeCount = Object.keys(variant.themes).length;
      totalThemes += themeCount;

      let stateCount = 0;
      for (const themeName in variant.themes) {
        stateCount += Object.keys(variant.themes[themeName].states).length;
      }
      totalStates += stateCount;

      console.log(
        `Вариант кнопки '${variantName}': ${themeCount} цветовых схем, ${stateCount} состояний`
      );
    }

    console.log(
      `Всего вариантов: ${totalVariants}, цветовых схем: ${totalThemes}, состояний: ${totalStates}`
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
