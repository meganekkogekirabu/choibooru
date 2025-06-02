fetch("/api/posts?total=true")

.then(response => response.json())

.then(data => {
    add_posts(data);
});

document.getElementById("logo").addEventListener("click", () => {
    window.location.href = "/";
});

load_translations()