const search_input = document.querySelector("[name=query]");
const search_button = document.getElementById("search-button");

function search() {
    if (!search_input.value) window.location.reload();

    fetch("/api/search", {
        method  : "POST",
        headers : {
            "Content-Type" : "application/json",
        },
        body : JSON.stringify({
            tag : search_input.value,
        }),
    })

    .then(response => response.json())

    .then(data => {
        add_posts(data);
    });
}

search_button.addEventListener("click", search);
search_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        search();
    }
});