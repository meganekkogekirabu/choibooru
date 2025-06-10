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

interface ApiResponse {
    status   : number;
    response?: string;
    error?   : string;
}

interface VoteResponse extends ApiResponse {
    dir?     : number;
}

interface TagResponse extends ApiResponse {
    tag?     : string;
}

interface RateResponse extends ApiResponse {
    rating?  : string;
}

interface SourceResponse extends ApiResponse {
    source?  : string;
}

declare global {
    interface Window {
        post_ready? : Promise<void>;
    }
}

let post: Post;
let post_ready: Promise<void>;

window.post_ready = post_ready = new Promise<void>((res) => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        window.location.href = "/";
        return;
    }

    fetch("/api/src?id=" + id)
        .then(res => res.json())
        .then((data: Post) => {
            post = data;
            const post_img = document.getElementById("post-img") as HTMLImageElement;
            if (post_img) {
                post_img.src = "/" + post.src;
            }

            const post_score = document.getElementById("post-score");
            if (post_score) {
                post_score.textContent = post.score.toString();
            }

            const post_uploader = document.getElementById("post-uploader");
            if (post_uploader) {
                post_uploader.textContent = post.uploader;
            }

            const post_date = document.getElementById("post-date");
            if (post_date) {
                post_date.textContent = new Date(post.date).toLocaleString();
            }

            const post_tags = document.getElementById("post-tags");
            if (post_tags && post.tags) {
                post.tags.split(",").forEach(tag => {
                    if (tag) {
                        const tag_el = document.createElement("a");
                        tag_el.href = "/?tag=" + tag;
                        tag_el.textContent = tag;
                        post_tags.appendChild(tag_el);
                    }
                });
            }

            const post_source = document.getElementById("post-source") as HTMLAnchorElement;
            if (post_source && post.source) {
                post_source.href = post.source;
                post_source.textContent = post.source;
            }

            const post_rating = document.getElementById("post-rating");
            if (post_rating) {
                post_rating.textContent = post.rating;
            }

            res();
        });
});

const vote = async (dir: number) => {
    const post_score = document.getElementById("post-score");
    const post_voters = document.getElementById("post-voters");

    if (!post_score || !post_voters) return;

    try {
        const response = await fetch("/api/vote", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: post.id,
                dir: dir,
            }),
        });

        const data: VoteResponse = await response.json();

        if (data.status === 200) {
            post.score += dir;
            post_score.textContent = post.score.toString();
            post_voters.textContent = (parseInt(post_voters.textContent || "0") + 1).toString();
        } else {
            alert(data.response);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

const add_tag = async () => {
    const tag_input = document.getElementById("tag-input") as HTMLInputElement;
    if (!tag_input) return;

    const tag = tag_input.value;
    if (!tag) return;

    try {
        const response = await fetch("/api/tag/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: post.id,
                tag: tag,
            }),
        });

        const data: TagResponse = await response.json();

        if (data.status === 200) {
            const post_tags = document.getElementById("post-tags");
            if (post_tags) {
                const tag_el = document.createElement("a");
                tag_el.href = "/?tag=" + tag;
                tag_el.textContent = tag;
                post_tags.appendChild(tag_el);
            }
            tag_input.value = "";
        } else {
            alert(data.response);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

const remove_tag = async (tag: string) => {
    try {
        const response = await fetch("/api/tag/remove", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: post.id,
                tag: tag,
            }),
        });

        const data: TagResponse = await response.json();

        if (data.status === 200) {
            const post_tags = document.getElementById("post-tags");
            if (post_tags) {
                const tag_el = post_tags.querySelector(`a[href="/?tag=${tag}"]`);
                if (tag_el) tag_el.remove();
            }
        } else {
            alert(data.response);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

const rate = async (rating: string) => {
    try {
        const response = await fetch("/api/rate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: post.id,
                rating: rating,
            }),
        });

        const data: RateResponse = await response.json();

        if (data.status === 200) {
            const post_rating = document.getElementById("post-rating");
            if (post_rating) {
                post_rating.textContent = rating;
            }
        } else {
            alert(data.response);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

const set_source = async () => {
    const source_input = document.getElementById("source-input") as HTMLInputElement;
    if (!source_input) return;

    const source = source_input.value;
    if (!source) return;

    try {
        const response = await fetch("/api/source", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: post.id,
                source: source,
            }),
        });

        const data: SourceResponse = await response.json();

        if (data.status === 200) {
            const post_source = document.getElementById("post-source") as HTMLAnchorElement;
            if (post_source) {
                post_source.href = source;
                post_source.textContent = source;
            }
            source_input.value = "";
        } else {
            alert(data.response);
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