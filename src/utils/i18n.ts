import * as Localization from 'expo-localization';

import i18n from 'i18n-js';
import lang from '../lang';

const translations = {
	en: lang.en,
	'zh-CN': lang.zh_CN,
	'zh-Hans': lang.zh_CN,
	'zh-rCN': lang.zh_CN,
}
// Set the key-value pairs for the different languages you want to support.
i18n.translations = translations;
// Set the locale once at the beginning of your app.
i18n.locale = Localization.locale;
// When a value is missing from a language it'll fallback to another language with the key present.
i18n.fallbacks = true;
//
i18n.defaultLocale = 'en';

export default i18n;
