const tr = i18n.load_translations().then(async () => {
    return await i18n.translations;
});

fetch(`/api/src${window.location.search}`, {
    method : "GET",
})

.then(response => response.json())

.then(async (data) => {
    const t = await tr;
    const posts = document.getElementById("posts");
    posts.innerHTML = "";

    if (data.deleted === 1) {
        const p = document.createElement("p");
        p.innerHTML = `${t["post-deleted"]}<br><br>${t["post-original-filename"]} ${data.src}`;
        p.lang = i18n.current_lang;
        posts.appendChild(p);
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
                    status.textContent = t["post-vote-warning"];
                    status.lang = i18n.current_lang;
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
                    status.textContent = t["post-vote-warning"];
                    status.lang = i18n.current_lang;
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
        a.innerHTML = `${t["post-original-image"]} &raquo;<br><br>`;
        a.lang = i18n.current_lang;
        a.target = "_blank";
        sidebar.appendChild(a);
    }

    const score = document.createElement("p");
    score.innerHTML = `${t["post-score"]} ${data.score}`;
    score.lang = i18n.current_lang;
    sidebar.appendChild(score);

    const tag_head = document.createElement("p")
    tag_head.innerHTML = `<br>${t["post-tags"]}`;
    tag_head.lang = i18n.current_lang;

    const tags = document.createElement("ul");
    tags.style.padding = "10px";

    if (!data.tags) {
        const li = document.createElement("li");
        li.textContent = t["post-tagme"];
        li.lang = i18n.current_lang;
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

            let dropdown;
            if (data.deleted === 1) {
                const rating = document.createElement("p");
                rating.innerHTML = `<br>${t["post-rating"]} ${data.rating ?? "general"}`;
                rating.lang = i18n.current_lang;
                score.after(rating);
            } else {
                const label = document.createElement("label");
                label.textContent = t["post-rating"];
                label.lang = i18n.current_lang;
                label.for = "rating";

                score.after(label);
                score.after(document.createElement("br"));

                dropdown = document.createElement("select");
                dropdown.id = "rating";

                const ratings = ["general", "sensitive", "questionable", "explicit"];
                // FIXME: these aren't integrated with i18n

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

                label.after(dropdown);
            }

            if (data.deleted !== 1) {
                fetch("/api/auth", {method: "POST"})
                .then(response => response.json())
                .then(async authdata => {
                    if (authdata.is_admin) {
                        const button = document.createElement("button")
                        button.textContent = t["post-delete"];
                        button.lang = i18n.current_lang;
                        button.style["margin-top"] = "15px";
                        button.addEventListener("click", async () => {
                            if (confirm(t["post-delete-confirm"])) {
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
            rating.innerHTML = `<br>${t["post-rating"]} ${data.rating}`;
            rating.lang = i18n.current_lang;
            score.after(rating);
        }
    });

    const uploader = document.createElement("p");
    uploader.innerHTML = `<br>${t["post-uploader"]} ${data.uploader}`;
    uploader.lang = i18n.current_lang;
    sidebar.appendChild(uploader);

    const date = document.createElement("p");
    date.innerHTML = `<br>${t["post-date"]} ${new Date(data.date).toLocaleDateString()}`;
    date.lang = i18n.current_lang;
    sidebar.appendChild(date);

    sidebar.appendChild(tag_head);
    sidebar.appendChild(tags);
});

document.getElementById("logo").addEventListener("click", () => {
    window.location.href = "/";
});

i18n.load_translations().then(() => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerHTML = i18n.t(el.dataset.i18n, el.dataset.i18nParams);
        el.lang = i18n.current_lang;
    });
});