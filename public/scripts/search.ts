import { i18n } from './common.js';
import { add_posts } from './common.js';

const search_input = document.querySelector("[name=query]") as HTMLInputElement;

(async () => {
    search_input.lang = i18n.current_lang
    search_input.placeholder = await i18n.load_translations().then(async () => {
        return i18n.translations["index-search"]
    });
})();

const search_button = document.getElementById("search-button");

function search(current_search_tag: string) {
    if (!search_input.value && !current_search_tag) {
        window.location.reload();
        return;
    }

    current_search_tag = current_search_tag ?? search_input.value;

    fetch("/api/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tag: current_search_tag,
            total: true,
        }),
    })

    .then(response => response.json())

    .then(data => {
        add_posts(data);
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            sidebar.innerHTML = "";
        }
    });
}

if (search_button) {
    search_button.addEventListener("click", () => search(search_input.value));
}
search_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        search(search_input.value);
    }
});