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
const CSS_OUTPUT_FILE = path.join(__dirname, "extracted", "themes.css");
const JSON_OUTPUT_FILE = path.join(__dirname, "extracted", "themes.json");

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

// Шаг 2: Найти страницу Palette
function findPalettePage(fileStructure) {
  if (!fileStructure.document || !fileStructure.document.children) {
    return null;
  }

  const palettePage = fileStructure.document.children.find(
    (page) => page.name === "Palette"
  );

  return palettePage ? palettePage.id : null;
}

// Шаг 3: Получить содержимое страницы Palette
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

// Шаг 4: Извлечь цветовое значение из ноды
function extractColorFromNode(node) {
  if (!node || !node.fills || node.fills.length === 0) {
    console.log(`Не найдена заливка для ноды ${node.name}`);
    return null;
  }

  const fill = node.fills[0];
  if (fill.type !== "SOLID" || !fill.color) {
    console.log(`Заливка ноды ${node.name} не является сплошным цветом`);
    return null;
  }

  const r = Math.round(fill.color.r * 255);
  const g = Math.round(fill.color.g * 255);
  const b = Math.round(fill.color.b * 255);

  // Округляем значение прозрачности до 2 знаков после запятой
  let a = fill.opacity !== undefined ? fill.opacity : 1;
  a = Math.round(a * 100) / 100;

  return {
    name: node.name,
    rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
    r,
    g,
    b,
    a,
  };
}

// Шаг 5: Проанализировать структуру страницы Palette
function parseColorsStructure(pageContent) {
  if (!pageContent.nodes) {
    throw new Error("Некорректный формат содержимого страницы");
  }

  const pageNode =
    pageContent.nodes[Object.keys(pageContent.nodes)[0]].document;

  const colorGroups = {};

  if (pageNode.children) {
    const sections = pageNode.children.filter(
      (node) =>
        node.type === "SECTION" && node.devStatus?.type === "READY_FOR_DEV"
    );

    if (sections.length === 0) {
      throw new Error(
        'На странице Palette не найдено ни одной секции с пометкой "Ready for dev"'
      );
    }

    console.log(`Найдено ${sections.length} секций с пометкой "Ready for dev"`);

    for (const section of sections) {
      const groupName = section.name;
      colorGroups[groupName] = [];

      if (section.children) {
        const frames = section.children.filter((node) => node.type === "FRAME");

        for (const frame of frames) {
          const colorData = extractColorFromNode(frame);

          if (colorData) {
            colorGroups[groupName].push(colorData);
            console.log(
              `Извлечен цвет ${colorData.name} (${colorData.rgba}) из группы ${groupName}`
            );
          }
        }
      }
    }
  }

  return colorGroups;
}

// Шаг 6: Преобразовать данные о цветах в CSS переменные
function generateCSSVariables(colorGroups) {
  let cssContent = `:root {\n`;

  for (const groupName in colorGroups) {
    cssContent += `\n  /* ${groupName} */\n`;

    for (const color of colorGroups[groupName]) {
      // Создаем CSS-совместимое имя переменной
      const cssGroupName = groupName.toLowerCase().replace(/\s+/g, "-");
      const cssColorName = color.name.toLowerCase().replace(/\s+/g, "-");

      cssContent += `  --theme-${cssGroupName}-${cssColorName}: ${color.rgba};\n`;
    }
  }

  cssContent += `}\n`;
  return cssContent;
}

// Шаг 7: Сохранить CSS файл
function saveToCSSFile(cssContent) {
  const filePath = CSS_OUTPUT_FILE;
  fs.writeFileSync(filePath, cssContent);
  console.log(`CSS переменные сохранены в ${filePath}`);
}

// Шаг 8: Преобразовать данные о цветах в структурированный JSON
function generateJSONStructure(colorGroups) {
  const result = {
    groups: {},
    timestamp: new Date().toISOString(),
  };

  for (const groupName in colorGroups) {
    const cssGroupName = groupName.toLowerCase().replace(/\s+/g, "-");
    result.groups[cssGroupName] = {};

    for (const color of colorGroups[groupName]) {
      const cssColorName = color.name.toLowerCase().replace(/\s+/g, "-");
      const cssVarName = `--theme-${cssGroupName}-${cssColorName}`;

      result.groups[cssGroupName][cssColorName] = {
        name: color.name,
        cssVariable: cssVarName,
        rgba: color.rgba,
        values: {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a,
        },
      };
    }
  }

  return result;
}

// Шаг 9: Сохранить JSON файл
function saveToJSONFile(jsonData) {
  const filePath = JSON_OUTPUT_FILE;
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  console.log(`JSON структура сохранена в ${filePath}`);
}

// Основная функция
async function main() {
  try {
    // 1. Получаем структуру файла
    const fileStructure = await getFileStructure();
    console.log(`Документ: ${fileStructure.name}`);

    // 2. Находим страницу Palette
    const palettePageId = findPalettePage(fileStructure);
    if (!palettePageId) {
      throw new Error("Страница Palette не найдена в документе");
    }
    console.log(`Найдена страница Palette: ${palettePageId}`);

    // 3. Получаем содержимое страницы
    const pageContent = await getPageContent(palettePageId);

    // 4. Анализируем структуру и извлекаем цвета
    const colorGroups = parseColorsStructure(pageContent);

    // 5. Генерируем CSS переменные
    const cssContent = generateCSSVariables(colorGroups);

    // 6. Сохраняем результат в CSS файл
    saveToCSSFile(cssContent);

    // 7. Генерируем и сохраняем JSON структуру
    const jsonStructure = generateJSONStructure(colorGroups);
    saveToJSONFile(jsonStructure);

    // 8. Выводим статистику
    let totalColors = 0;

    for (const groupName in colorGroups) {
      const groupColors = colorGroups[groupName].length;
      totalColors += groupColors;
      console.log(`Группа цветов '${groupName}': ${groupColors} цветов`);
    }

    console.log(`Всего цветов: ${totalColors}`);
  } catch (error) {
    console.error("Произошла ошибка:", error);
  }
}

// Запуск скрипта
main();
