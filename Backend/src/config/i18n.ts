import { I18n } from 'i18n';
import path from 'path';

const i18n = new I18n();

i18n.configure({
    locales: ['es', 'en', 'ca'],
    directory: path.join(__dirname, '../lang'),
    defaultLocale: 'es',
    objectNotation: true,
    updateFiles: false,
});

export default i18n;