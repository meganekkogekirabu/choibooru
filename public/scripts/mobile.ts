import { i18n } from "./common.js";
import { auth_ready } from "./auth.js";

let mobile_ready = new Promise((res) => {

if (screen.width < 1090) {
    const sign_wrapper = document.getElementById("sign-wrapper");
    const search_bar = document.getElementById("search-bar");
    const sidebar = document.getElementById("sidebar");
    const logo = document.getElementById("logo");
    const head_wrapper = document.getElementById("head-wrapper");
    const signin_status = document.getElementById("signin-status");
    const headname = document.getElementById("headname");

    if (!sidebar) throw new Error("sidebar missing");

    headname!.addEventListener("click", () => {
        window.location.href = "/";
    });

    sidebar.style.display = "none"; // hide sidebar while loading so it's not as ugly

    (async () => {
        await auth_ready
        .then(() => {
            sign_wrapper!.remove();
            signin_status!.remove();
        });

        if (window.location.pathname.startsWith('/post')) {
            const { post_ready } = await import('./post.js');
            await post_ready
            .then(() => {
                sidebar.remove();
            });
        }
    })();

    search_bar?.remove();
    logo!.remove();

    const menu_btn = document.createElement("button");
    menu_btn.textContent = "≡";
    menu_btn.id = "menu-button";

    menu_btn.addEventListener("click", async () => {
        const menu = document.createElement("div");
        menu.id = "menu";
        
        const close_menu = document.createElement("button");
        close_menu.id = "close-menu-button";
        close_menu.textContent = "x";
        close_menu.addEventListener("click", () => {
            menu.replaceWith(parent as Node);
        });

        sidebar.style.display = "unset";

        const posts = document.createElement("div");
        posts.id = "posts";

        menu.appendChild(close_menu);
        menu.appendChild(logo!.cloneNode(true));
        menu.appendChild(sign_wrapper!);
        menu.appendChild(signin_status!);
        menu.appendChild(sidebar);
        menu.appendChild(posts);

        const parent = document.getElementById("parent");
        parent!.replaceWith(menu);

        document.querySelectorAll("#signin-status>br").forEach(el => {el.remove()});
    });

    if (search_bar) {
        const search_btn = document.createElement("button");
        search_btn.innerHTML = "&#x1F50E;&#xFE0E;";
        search_btn.id = "mobile-search-button";

        let search_open = false;

        search_btn.addEventListener("click", () => {
            if (!search_open) {
                search_btn.textContent = "x";
                menu_btn.remove();
                headname!.replaceWith(search_bar);
                search_open = true;
            } else {
                head_wrapper!.appendChild(headname!);
                head_wrapper!.appendChild(menu_btn);
                search_bar.remove();
                search_btn.innerHTML = "&#x1F50E;&#xFE0E;";
                search_open = false;
            }
        });

        head_wrapper!.prepend(search_btn);
    }

    head_wrapper!.appendChild(menu_btn);

    i18n.load_translations().then(async () => {
        await auth_ready
        .then(() => {
            document.querySelectorAll('[data-i18n]').forEach(el => {
                el.innerHTML = i18n.t(el.dataset.i18n, el.dataset.i18nParams);
                el.lang = i18n.current_lang;
            });
        });

        if (i18n.current_lang !== "en") {
            const footer_right = document.getElementById("footer-right");
            const move_en = document.createElement("p");
            move_en.innerHTML = "English";
            move_en.style.cursor = "pointer";

            move_en.addEventListener("click", () => {
                window.location.href = window.location.href.replace(/(?<=^http:\/\/)[^.]+\./, "")
            });

            if (footer_right) footer_right.appendChild(move_en);
        }
    });
}

}); // promise

export { mobile_ready };