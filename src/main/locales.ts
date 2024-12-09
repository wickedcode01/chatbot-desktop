import { app } from 'electron'

export default class Locale {
    locale: string = 'en'

    constructor() {
        try {
            this.locale = app.getLocale()
        } catch (e) {
            console.log(e)
        }
    }


}


