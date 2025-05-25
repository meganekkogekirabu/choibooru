function add_posts(data) {
    const posts = document.getElementById("posts");
    const parent = document.getElementById("parent");
    let current = 1;
    let current_search_tag = data.tag || "";

    function calculate_chunk_size() {
        const viewport_width = window.innerWidth;
        const post_width = 300;
        const posts_container_width = (viewport_width * 6) / 7;
        const posts_per_row = Math.max(1, Math.floor(posts_container_width / post_width));
        return posts_per_row * 2;
    }

    let chunk = calculate_chunk_size();
    let total = Math.ceil(data.total / chunk);
    
    function display(page) {
        posts.innerHTML = "";
        current = page;
        
        const start = (page - 1) * chunk;
        
        if (current_search_tag) {
            fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tag: current_search_tag,
                    offset: start,
                    limit: chunk
                }),
            })
            .then(response => response.json())
            .then(page_data => render_posts(page_data));
        } else {
            fetch(`/api/posts?offset=${start}&limit=${chunk}`)
                .then(response => response.json())
                .then(page_data => render_posts(page_data));
        }
    }

    function render_posts(page_data) {
        for (const post of page_data) {
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
        update();
    }

    function update() {
        document.getElementById("pagination")?.remove();

        const pagination = document.createElement("div");
        pagination.id = "pagination";
        pagination.style.textAlign = "center";
        pagination.style.marginTop = "20px";
        posts.after(pagination);

        const new_chunk = calculate_chunk_size();
        if (new_chunk !== chunk) {
            chunk = new_chunk;
            total = Math.ceil(data.total / chunk);
            current = Math.min(current, total);
        }

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
            page_button.textContent = i;
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
        
        window.addEventListener("resize", () => {
            display(current);
        });
    } else {
        posts.textContent = current_search_tag ? 
            `No results found for "${current_search_tag}"` : 
            "No posts yet!";
    }
}

fetch("/api/posts?total=true")

.then(response => response.json())

.then(data => {
    add_posts(data);
});

document.getElementById("logo").addEventListener("click", () => {
    window.location.href = "/";
});