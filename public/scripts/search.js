/*const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resultsDiv = document.getElementById("results");

searchButton.addEventListener("click", searchPosts);
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchPosts();
});

async function searchPosts() {
    const tag = searchInput.value.trim();
    if (!tag) {
        alert("Please enter a search tag");
        return;
    }

    try {
        const response = await fetch("/api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ tag })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const posts = await response.json();
        displayResults(posts);
    } catch (error) {
        console.error("Search failed:", error);
        resultsDiv.textContent = `Search failed: ${error.message}`;
    }
}

function displayResults(posts) {
    if (posts.length === 0) {
        resultsDiv.textContent = "No posts found";
        return;
    }

    resultsDiv.innerHTML = posts.map(post => {
        var tags = post.tags.match(/[^,]+/g)?.filter(Boolean) || [];
        tags = tags.join(", ");
        return `<div class="post">
            <strong>${tags}</strong>
            <img src="${post.src}" style="max-width: 600px; display: block;">
            <small>Posted: ${new Date(post.date).toLocaleString()}</small>
        </div>`
    }).join("");
}*/

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
        const posts = document.getElementById("posts")
        console.log(data);
        if (data[0]) {
            posts.innerHTML = "";

            (async function() {
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
                    posts.appendChild(figure);
                }
            })();
        } else {
            posts.textContent = "Nothing here!";
        }
    });
}

search_button.addEventListener("click", search);
search_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        search();
    }
});