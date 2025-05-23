fetch("/api/posts")

.then(response => response.json())

.then(data => {
    if (data[0]) {
        const posts = document.getElementById("posts")
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
    }
});

document.getElementById("logo").addEventListener("click", () => {
    window.location.href = "/";
});