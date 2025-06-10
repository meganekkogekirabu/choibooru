import { i18n } from './common';
import { auth_ready } from './auth';

interface Post {
    id       : number;
    src      : string;
    uploader : string;
    date     : number;
    score    : number;
    voters   : string;
    tags     : string;
    rating   : string;
    deleted  : number;
    source?  : string;
}

interface SearchResponse {
    total? : number;
    tag?   : string;
    error? : string;
}

let search_ready = new Promise<void>((res) => {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');

    if (!tag) {
        window.location.href = "/";
        return;
    }

    fetch("/api/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            tag: tag,
            total: true,
        }),
    })
        .then(res => res.json())
        .then((data: SearchResponse) => {
            const search_tag = document.getElementById("search-tag");
            if (search_tag) {
                search_tag.textContent = tag;
            }

            const search_total = document.getElementById("search-total");
            if (search_total) {
                search_total.textContent = data.total?.toString() || "0";
            }

            res();
        });
});

const search = async (offset: number = 0) => {
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');

    if (!tag) return;

    try {
        const response = await fetch("/api/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tag: tag,
                offset: offset,
                limit: 10,
            }),
        });

        const data: Post[] = await response.json();

        const search_posts = document.getElementById("search-posts");
        if (!search_posts) return;

        data.forEach(post => {
            const post_el = document.createElement("div");
            post_el.className = "post";

            const post_img = document.createElement("img");
            post_img.src = "/" + post.src;
            post_img.alt = post.tags;

            const post_link = document.createElement("a");
            post_link.href = "/post?id=" + post.id;
            post_link.appendChild(post_img);

            post_el.appendChild(post_link);
            search_posts.appendChild(post_el);
        });

        if (data.length < 10) {
            const load_more = document.getElementById("load-more");
            if (load_more) load_more.remove();
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

i18n.load_translations().then(async () => {
    await auth_ready;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (el instanceof HTMLElement) {
            el.innerHTML = i18n.t(el.dataset.i18n || "", el.dataset.i18nParams);
            el.lang = i18n.current_lang;
        }
    });

    if (i18n.current_lang !== "en") {
        const footer_right = document.getElementById("footer-right");
        if (footer_right) {
            const move_en = document.createElement("p");
            move_en.innerHTML = "English";
            move_en.style.cursor = "pointer";

            move_en.addEventListener("click", () => {
                window.location.href = window.location.href.replace(/(?<=^http:\/\/)[^.]+\./, "");
            });

            footer_right.appendChild(move_en);
        }
    }
}); 