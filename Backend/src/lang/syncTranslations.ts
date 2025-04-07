import * as fs from 'fs';
import * as path from 'path';

// Importación dinámica de ESM
let translate: any;

async function loadTranslate() {
  const imported = await import('translate');
  translate = imported.default;

  // Configurar el motor de traducción
  translate.engine = 'google';
  translate.key = '';
}

const baseLocale: string = 'es';
const locales: string[] = ['en', 'fr', 'de', 'ca', 'zh', 'ja'];
const baseDir: string = path.join(__dirname);

const languageMap: Record<string, string> = {
  es: 'es',
  en: 'en',
  fr: 'fr',
  de: 'de',
  ca: 'ca',
  zh: 'zh',
  ja: 'ja',
};

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

const flatten = (obj: TranslationObject, prefix: string = ''): Record<string, string> =>
  Object.keys(obj).reduce((acc: Record<string, string>, k: string) => {
    const pre = prefix.length ? `${prefix}.` : '';
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      Object.assign(acc, flatten(obj[k] as TranslationObject, pre + k));
    } else {
      acc[pre + k] = obj[k] as string;
    }
    return acc;
  }, {});

const unflatten = (flat: Record<string, string>): TranslationObject => {
  const result: TranslationObject = {};
  Object.keys(flat).forEach((key: string) => {
    const keys: string[] = key.split('.');
    let current: TranslationObject = result;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = current[keys[i]] || {};
      current = current[keys[i]] as TranslationObject;
    }
    current[keys[keys.length - 1]] = flat[key];
  });
  return result;
};

const translateText = async (text: string, targetLang: string): Promise<string> => {
  try {
    const translated = await translate(text, { from: 'es', to: targetLang });
    return translated;
  } catch (error) {
    console.error(`Error al traducir "${text}" a ${targetLang}:`, error);
    return `ERROR_${text}`;
  }
};

const syncTranslations = async (): Promise<void> => {
  const baseFilePath: string = path.join(baseDir, `${baseLocale}.json`);
  
  if (!fs.existsSync(baseFilePath)) {
    console.error(`Archivo base no encontrado: ${baseFilePath}`);
    return;
  }

  let baseFile: TranslationObject;
  try {
    const fileContent: string = fs.readFileSync(baseFilePath, 'utf8');
    if (!fileContent.trim()) {
      console.error(`Archivo vacío: ${baseFilePath}`);
      return;
    }
    baseFile = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error al parsear el archivo ${baseFilePath}:`, error);
    return;
  }

  const baseFlat: Record<string, string> = flatten(baseFile);

  for (const locale of locales) {
    console.log(`Traduciendo al idioma: ${locale}`);
    const filePath: string = path.join(baseDir, `${locale}.json`);

    let current: TranslationObject = {};
    if (fs.existsSync(filePath)) {
      try {
        const currentContent: string = fs.readFileSync(filePath, 'utf8');
        current = currentContent.trim() ? JSON.parse(currentContent) : {};
      } catch (error) {
        console.error(`Error al parsear el archivo ${filePath}:`, error);
        continue;
      }
    }

    const currentFlat: Record<string, string> = flatten(current);
    const updatedFlat: Record<string, string> = { ...currentFlat };

    for (const key of Object.keys(baseFlat)) {
      const isTranslated = currentFlat[key] && !currentFlat[key].startsWith('ERROR_');
      if (!isTranslated) {
        const value: string = baseFlat[key];
        const translatedValue: string = await translateText(value, languageMap[locale]);
        updatedFlat[key] = translatedValue;
      }
    }

    const updated: TranslationObject = unflatten(updatedFlat);
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`Traducción completada para ${locale}`);
  }
};

async function main() {
  await loadTranslate();
  await syncTranslations();
  console.log('Sincronización y traducción completada');
}

main().catch((error) => {
  console.error('Error durante la sincronización:', error);
  process.exit(1);
});