interface Translations {
    [key: string] : string;
}

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

interface PostData {
    tag    : string;
    offset : number;
    limit  : number;
    total  : number;
    error? : string;
}

class I18nService {
    public translations: Translations;
    public current_lang: string;

    constructor() {
        this.translations = {};
        this.current_lang = "en";
    }

    async load_translations(): Promise<void> {
        try {
            const langResponse = await fetch("/api/lang");
            const langData = await langResponse.json();
            const lang = langData.lang;
            
            const response = await fetch(`/api/translations?lang=${lang}`);
            this.translations = await response.json();
            this.current_lang = lang;
            document.cookie = `lang=${lang};path=/;max-age=31536000`; // 1 year
        } catch(err) {
            console.error("failed to load translations:", err);
        }
    }

    t(key: string, params?: string): string {
        let translation = this.translations[key] || key;

        if (params) {
            const parsedParams = JSON.parse(params);
            for (const [k, v] of Object.entries(parsedParams)) {
                translation = translation.replace(`{${k}}`, String(v));
            }
        }

        return translation;
    }
}

const i18n = new I18nService();

const tr = i18n.load_translations().then(async () => {
    return i18n.translations;
});

async function add_posts(data: PostData): Promise<void> {
    const t = await tr;
    const posts = document.getElementById("posts");
    if (!posts) return;

    let current = 1;
    let current_search_tag = data.tag || "";
    
    const chunk = 14;
    const total = Math.ceil((data.total as number || 0) / chunk);
    
    function display(page: number): void {
        if (!posts) return;
        posts.innerHTML = "";
        current = page;
        
        const start = (page - 1) * chunk;
        
        if (current_search_tag) {
            fetch("/api/search", {
                method  : "POST",
                headers : {
                    "Content-Type": "application/json",
                },
                body    : JSON.stringify({
                    query  : current_search_tag,
                    offset : start,
                    limit  : chunk
                }),
            })
            .then(response => response.json())
            .then(page_data => {
                if (Array.isArray(page_data)) {
                    render_posts(page_data);
                } else {
                    console.error("Invalid response format:", page_data);
                    posts.textContent = t["index-none"];
                    posts.lang = i18n.current_lang;
                }
            })
            .catch(error => {
                console.error("Error fetching posts:", error);
                posts.textContent = t["index-none"];
                posts.lang = i18n.current_lang;
            });
        } else {
            fetch(`/api/posts?offset=${start}&limit=${chunk}`)
                .then(response => response.json())
                .then(page_data => render_posts(page_data));
        }
    }

    function render_posts(page_data: Post[]): void {
        if (!posts) return;
        for (const post of page_data) {
            const figure = document.createElement("figure");
            figure.classList.add("post");

            const img = document.createElement("img");
            img.src = post.src;
            img.addEventListener("click", () => {
                window.location.href = `/post?id=${post.id}`;
            });

            if (post.rating === "explicit") {
                img.style.borderColor = "#F16";
                img.title = "explicit";
            }

            const subtitle = document.createElement("figcaption");
            subtitle.textContent = "#" + post.id;
            subtitle.style.fontSize = "13px";

            const date = document.createElement("span");
            date.style.float = "right";
            date.textContent = new Date(post.date).toLocaleDateString();

            subtitle.appendChild(date);
            figure.appendChild(img);
            figure.appendChild(subtitle);
            posts.appendChild(figure);
        }

        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.innerHTML = "";
        update();
    }

    function update(): void {
        if (!posts) return;
        const existingPagination = document.getElementById("pagination");
        if (existingPagination) existingPagination.remove();

        const pagination = document.createElement("div");
        pagination.id = "pagination";
        pagination.style.textAlign = "center";
        pagination.style.marginTop = "20px";
        posts.after(pagination);

        const first_button = document.createElement("button");
        first_button.textContent = "<<";
        first_button.disabled = current === 1;
        first_button.addEventListener("click", () => display(1));
        pagination.appendChild(first_button);

        const prev_button = document.createElement("button");
        prev_button.textContent = "<";
        prev_button.disabled = current === 1;
        prev_button.addEventListener("click", () => display(current - 1));
        pagination.appendChild(prev_button);

        const pagination_num = document.createElement("div");
        pagination_num.id = "pagination-num";
        pagination.appendChild(pagination_num);

        const max = 3;
        let start_page = Math.max(1, current - Math.floor(max / 2));
        let end_page = Math.min(total, start_page + max - 1);

        if (end_page - start_page + 1 < max) {
            start_page = Math.max(1, end_page - max + 1);
        }

        for (let i = start_page; i <= end_page; i++) {
            const page_button = document.createElement("button");
            page_button.textContent = i.toString();
            if (i === current) {
                page_button.style.fontWeight = "bold";
                page_button.disabled = true;
            }
            page_button.addEventListener("click", () => display(i));
            pagination_num.appendChild(page_button);
        }

        const next_button = document.createElement("button");
        next_button.textContent = ">";
        next_button.disabled = current === total;
        next_button.addEventListener("click", () => display(current + 1));
        pagination.appendChild(next_button);

        const last_button = document.createElement("button");
        last_button.textContent = ">>";
        last_button.disabled = current === total;
        last_button.addEventListener("click", () => display(total));
        pagination.appendChild(last_button);
    }

    if (data.total) {
        display(1);
    } else {
        posts.textContent = t["index-none"];
        posts.lang = i18n.current_lang;
    }
}

function load_translations(): void {
    i18n.load_translations().then(() => {
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
}

export { add_posts, load_translations, i18n, tr }; 