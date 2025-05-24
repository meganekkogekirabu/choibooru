fetch(`/api/src${window.location.search}`, {
    method : "GET",
})

.then(response => response.json())

.then(data => {
    const posts = document.getElementById("posts");
    posts.innerHTML = "";

    if (data.deleted === 1) {
        const p = document.createElement("p");
        p.textContent = "This post has been deleted.";
        posts.appendChild(p);
        fetch("/api/auth", {method: "POST"})
        .then(response => response.json())
        .then(authdata => {
            if (authdata.is_admin) {
                p.innerHTML = `${p.textContent}<br><br>Original filename: ${data.src}`
            }
        })
    } else {
        const figure = document.createElement("figure");
        const img = document.createElement("img");
        img.src = data.src;
        img.style["max-height"] = "400px";

        const caption = document.createElement("figcaption");
        caption.style.display = "flex";
        caption.style["justify-content"] = "space-between";
        caption.style["margin-top"] = "15px";

        const status = document.createElement("div");
        status.style["font-size"] = "13px";

        const vote = document.createElement("div");

        const upvote = document.createElement("a");
        upvote.textContent = "▲";
        upvote.style.color = "#5963A6";
        upvote.style.border = "solid 1px";
        upvote.style.cursor = "pointer";
        upvote.addEventListener("click", () => {
            fetch("/api/auth", {method: "POST"})
            .then(response => response.json())
            .then(async authdata => {
                if (!authdata.username) {
                    status.textContent = "You must be logged in to vote.";
                } else {
                    await fetch("/api/vote", {
                        method  : "POST",
                        headers : {
                            "Content-Type": "application/json",
                        },
                        body    : JSON.stringify({
                            dir : 1,
                            id  : data.id,
                        }),
                    });
                    window.location.reload();
                }
            });
        });

        const downvote = document.createElement("a");
        downvote.textContent = "▼";
        downvote.style.color = "#A659A3";
        downvote.style.border = "solid 1px";
        downvote.style.cursor = "pointer";
        downvote.addEventListener("click", () => {
            fetch("/api/auth", {method: "POST"})
            .then(response => response.json())
            .then(async data => {
                if (!data.username) {
                    status.textContent = "You must be logged in to vote.";
                } else {
                    await fetch("/api/vote", {
                        method  : "POST",
                        headers : {
                            "Content-Type": "application/json",
                        },
                        body    : JSON.stringify({
                            dir : -1,
                            id  : data.id,
                        }),
                    });
                    window.location.reload();
                }
            });
        });

        vote.appendChild(upvote);
        vote.appendChild(downvote);
        caption.appendChild(vote);
        caption.appendChild(status);

        figure.appendChild(img);
        figure.appendChild(caption);
        posts.appendChild(figure);
    }

    const sidebar = document.getElementById("sidebar");

    if (data.deleted !== 1) {
        const a = document.createElement("a");
        a.href = data.src;
        a.innerHTML = "original image &raquo;<br><br>";
        a.target = "_blank";
        sidebar.appendChild(a);
    }

    const score = document.createElement("p");
    score.innerHTML = `score: ${data.score}`;
    sidebar.appendChild(score);

    const tag_head = document.createElement("p")
    tag_head.innerHTML = "<br>tags:";

    const tags = document.createElement("ul");
    tags.style.padding = "10px";

    if (!data.tags) {
        const li = document.createElement("li");
        li.textContent = "tag me!";
        tags.appendChild(li);
    } else {
        const _tags = data.tags.match(/[^,]+/g)?.filter(Boolean) || [];
        _tags.forEach((tag) => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.classList.add("tag");
            a.dataset.target = tag;

            li.textContent = tag;
            li.appendChild(a);
            tags.appendChild(li);
        });
    }

    fetch("/api/auth", {method: "POST"})
    .then(response => response.json())
    .then(async (authdata) => {
        if (authdata.username) {
            if (data.deleted !== 1)  {
                const form = document.createElement("form");
                form.style["margin-top"] = "15px";
                form.style.display = "inline-block";

                const input = document.createElement("input");
                input.name = "tag";
                input.style.height = "10px";
                input.style.width = "80px";

                const submit = document.createElement("input");
                submit.type = "submit";
                submit.value = "+";
                submit.id = "submit";

                form.appendChild(input);
                form.appendChild(submit);

                form.addEventListener("submit", async (event) => {
                    event.preventDefault();

                    const formData = new FormData(form);
                    
                    await fetch("/api/tag/add", {
                        method  : "POST",
                        headers : {
                            "Content-Type": "application/json",
                        },
                        body    : JSON.stringify({
                            tag : formData.get("tag"),
                            id  : data.id,
                        }),
                    });

                    window.location.reload();
                })

                sidebar.appendChild(form);

                document.querySelectorAll(".tag").forEach(tag => {
                    tag.innerHTML = "&nbsp;-";
                    tag.style.cursor = "pointer";
                    
                    tag.addEventListener("click", async () => {
                    await fetch("/api/tag/remove", {
                        method  : "POST",
                        headers : {
                            "Content-Type": "application/json",
                        },
                        body    : JSON.stringify({
                            tag : tag.dataset.target,
                            id  : data.id,
                        }),
                    });

                    window.location.reload();
                })});
            }

            if (data.deleted === 1) {
                const rating = document.createElement("p");
                rating.innerHTML = `<br>rating: ${data.rating ?? "general"}`;
                score.after(rating);
            } else {
                const dropdown = document.createElement("select");
                dropdown.id = "rating";

                const ratings = ["general", "sensitive", "questionable", "explicit"];

                ratings.forEach(option => {
                    const element = document.createElement("option");
                    element.value = option;
                    element.textContent = option;

                    if (data.rating === option) element.selected = true;

                    dropdown.appendChild(element);
                });

                dropdown.addEventListener("change", async (event) => {
                    const selected = event.target.value

                    try {
                        await fetch("/api/rate", {
                            method  : "POST",
                            headers : {
                                "Content-Type": "application/json",
                            },
                            body    : JSON.stringify({
                                id     : data.id,
                                rating : selected,
                            }),
                        });
                        window.location.reload();
                    } catch(err) {
                        console.error(err);
                    }
                });
            }

            const label = document.createElement("label");
            label.textContent = "rating:";
            label.for = "rating";

            score.after(label);
            score.after(document.createElement("br"));
            if (typeof dropdown !== "undefined") {
                label.after(dropdown);
            }

            if (data.deleted === 1) {
                
            } else {
                fetch("/api/auth", {method: "POST"})
                .then(response => response.json())
                .then(async authdata => {
                    if (authdata.is_admin) {
                        const button = document.createElement("button")
                        button.textContent = "delete";
                        button.style["margin-top"] = "15px";
                        button.addEventListener("click", async () => {
                            if (confirm("Are you sure you want to delete this post?")) {
                                await fetch("/api/delete", {
                                    method  : "POST",
                                    headers : {
                                        "Content-Type": "application/json",
                                    },
                                    body    : JSON.stringify({
                                        id : data.id,
                                    }),
                                });

                                window.location.reload();
                            }
                        });
                        sidebar.appendChild(button);
                    }
                });
            }
        } else {
            const rating = document.createElement("p");
            rating.innerHTML = `<br>rating: ${data.rating}`;
            score.after(rating);
        }
    });

    const uploader = document.createElement("p");
    uploader.innerHTML = `<br>uploader: ${data.uploader}`;
    sidebar.appendChild(uploader);

    const date = document.createElement("p");
    date.innerHTML = `<br>date uploaded: ${new Date(data.date).toLocaleDateString()}`;
    sidebar.appendChild(date);

    sidebar.appendChild(tag_head);
    sidebar.appendChild(tags);
});

document.getElementById("logo").addEventListener("click", () => {
    window.location.href = "/";
});