import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import zhHans from './locales/zh-Hans/translation.json'



i18n.use(initReactI18next).init({
    resources: {
        'zh-Hans': {
            translation: zhHans,
        },
    },
    fallbackLng: 'en',

    interpolation: {
        escapeValue: false,
    },

    detection: {
        caches: [],
    },
})

export default i18n

