import { i18n } from './common.js';
import { add_posts } from './common.js';

const search_input = document.querySelector("[name=query]") as HTMLInputElement;

(async () => {
    search_input.lang = i18n.current_lang
    search_input.placeholder = await i18n.load_translations().then(async () => {
        return i18n.translations["index-search"]
    });
})();

const search_button = document.getElementById("search-button");

interface SearchQuery {
    and : string[];
    or  : string[];
    not : string[];
}

function parse(query: string): SearchQuery {
    const result: SearchQuery = {
        and : [],
        or  : [],
        not : []
    };

    if (!query.trim()) {
        return result;
    }

    const or_parts = query.split('|').map(part => part.trim());
    
    if (or_parts.length === 1 && !query.includes('&') && !query.includes('-')) {
        result.and.push(query.trim());
        return result;
    }

    or_parts.forEach(part => {
        const and_parts = part.split('&').map(p => p.trim());
        
        and_parts.forEach(and_part => {
            if (and_part.startsWith('-')) {
                result.not.push(and_part.substring(1).trim());
            } else {
                result.and.push(and_part);
            }
        });
    });

    if (or_parts.length > 1) {
        result.or = result.and;
        result.and = [];
    }

    result.and = result.and.filter(tag => tag.length > 0);
    result.or = result.or.filter(tag => tag.length > 0);
    result.not = result.not.filter(tag => tag.length > 0);

    return result;
}

function search(current_search_tag: string) {
    if (!search_input.value && !current_search_tag) {
        window.location.reload();
        return;
    }

    current_search_tag = current_search_tag ?? search_input.value;
    const query = parse(current_search_tag);

    console.log("Search query:", current_search_tag);
    console.log("Parsed query:", query);

    fetch("/api/search", {
        method  : "POST",
        headers : {
            "Content-Type": "application/json",
        },
        body    : JSON.stringify({
            query  : query,
            total  : true,
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Search response:", data);
        add_posts(data);
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            sidebar.innerHTML = "";
        }
    })
    .catch(error => {
        console.error("Search error:", error);
    });
}

if (search_button) {
    search_button.addEventListener("click", () => search(search_input.value));
}

search_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        search(search_input.value);
    }
});

export { search };