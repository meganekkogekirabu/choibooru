const search_input = document.querySelector("[name=query]");
const search_button = document.getElementById("search-button");
let current_search_tag;

function search() {
    if (!search_input.value) {
        window.location.reload();
        return;
    }

    current_search_tag = search_input.value;

    fetch("/api/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tag: current_search_tag,
            total: true
        }),
    })
    .then(response => response.json())
    .then(data => {
        add_posts(data);
    });
}

function get_search_results(page) {
    const chunk = calculate_chunk_size();
    const offset = (page - 1) * chunk;
    
    fetch("/api/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tag: current_search_tag,
            offset: offset,
            limit: chunk
        }),
    })

    .then(response => response.json())

    .then(data => {
        const posts_container = document.getElementById("posts");
        posts_container.innerHTML = "";
        
        for (const post of data) {
            const figure = document.createElement("figure");
            figure.classList.add("post");

            const img = document.createElement("img");
            img.src = post.src;
            img.addEventListener("click", () => {
                window.location.href = `/post?id=${post.id}`;
            });

            if (post.rating === "explicit") {
                img.style["border-color"] = "#F16";
                img.title = "explicit";
            }

            const subtitle = document.createElement("figcaption");
            subtitle.textContent = "#" + post.id;
            subtitle.style["font-size"] = "13px";

            const date = document.createElement("span");
            date.style.float = "right";
            date.textContent = new Date(post.date).toLocaleDateString();

            subtitle.appendChild(date);
            figure.appendChild(img);
            figure.appendChild(subtitle);
            posts_container.appendChild(figure);
        }
    });
}

search_button.addEventListener("click", search);
search_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        search();
    }
});