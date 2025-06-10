import { i18n } from './common.js';
import { auth_ready } from './auth.js';

declare global {
    interface Window {
        post_ready?: Promise<void>;
    }
}

let mobile_ready = new Promise<void>((res) => {
    if (screen.width < 1090) {
        const sign_wrapper = document.getElementById("sign-wrapper");
        const search_bar = document.getElementById("search-bar");
        const sidebar = document.getElementById("sidebar");
        const logo = document.getElementById("logo");
        const head_wrapper = document.getElementById("head-wrapper");
        const signin_status = document.getElementById("signin-status");
        const headname = document.getElementById("headname");

        if (headname) {
            headname.addEventListener("click", () => {
                window.location.href = "/";
            });
        }

        if (sidebar) {
            sidebar.style.display = "none"; // hide sidebar while loading so it's not as ugly
        }

        (async () => {
            await auth_ready;
            if (sign_wrapper) sign_wrapper.remove();
            if (signin_status) signin_status.remove();

            if (typeof window.post_ready !== "undefined") {
                await window.post_ready;
                if (sidebar) sidebar.remove();
            }
        })();

        if (search_bar) search_bar.remove();
        if (logo) logo.remove();

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
                const parent = document.getElementById("parent");
                if (parent) menu.replaceWith(parent);
            });

            if (sidebar) {
                sidebar.style.display = "unset";
            }

            const posts = document.createElement("div");
            posts.id = "posts";

            menu.appendChild(close_menu);
            const logoClone = logo?.cloneNode(true);
            if (logoClone) menu.appendChild(logoClone as Node);
            if (sign_wrapper) menu.appendChild(sign_wrapper as Node);
            if (signin_status) menu.appendChild(signin_status as Node);
            if (sidebar) menu.appendChild(sidebar as Node);
            menu.appendChild(posts);

            const parent = document.getElementById("parent");
            if (parent) parent.replaceWith(menu);

            document.querySelectorAll("#signin-status>br").forEach(el => el.remove());
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
                    if (headname && search_bar) headname.replaceWith(search_bar);
                    search_open = true;
                } else {
                    if (head_wrapper) {
                        if (headname) head_wrapper.appendChild(headname);
                        head_wrapper.appendChild(menu_btn);
                    }
                    search_bar.remove();
                    search_btn.innerHTML = "&#x1F50E;&#xFE0E;";
                    search_open = false;
                }
            });

            if (head_wrapper) head_wrapper.prepend(search_btn);
        }

        if (head_wrapper) {
            if (headname) head_wrapper.appendChild(headname);
            head_wrapper.appendChild(menu_btn);
        }

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
    }
    res();
});

export { mobile_ready }; 