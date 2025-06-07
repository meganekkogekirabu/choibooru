const search_input = document.querySelector("[name=query]");

(async () => {
    search_input.lang = i18n.current_lang
    search_input.placeholder = await i18n.load_translations().then(async () => {
        return await i18n.translations["index-search"]
    });
})();

const search_button = document.getElementById("search-button");

function search(current_search_tag) {
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
        document.getElementById("sidebar").innerHTML = "";
    });
}

search_button.addEventListener("click", search);
search_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        search();
    }
});