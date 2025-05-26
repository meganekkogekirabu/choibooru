class i18n_service {
    constructor() {
        this.translations = {};
        this.current_lang = "en";
    }

    async load_translations() {
        try {
            const lang = navigator.language;
            const response = await fetch(`/api/translations?lang=${lang}`);
            this.translations = await response.json();
            this.current_lang = lang;
            document.cookie = `lang=${lang};path=/;max-age=31536000`; // 1 year
        } catch(err) {
            console.error("failed to load translations:", err);
        }
    }

    t(key, params) {
        let translation = this.translations[key] || key;

        if (params) {
            params = JSON.parse(params);

            for (const [k, v] of Object.entries(params)) {
                translation = translation.replace(`{${k}}`, v);
            }
        }

        return translation;
    }
}

window.i18n = new i18n_service;