import { add_posts, load_translations } from './common.js';

fetch("/api/posts?total=true")
    .then(response => response.json())
    .then((data) => {
        add_posts(data);
    });

const logo = document.getElementById("logo");
if (logo) {
    logo.addEventListener("click", () => {
        window.location.href = "/";
    });
}

load_translations(); 