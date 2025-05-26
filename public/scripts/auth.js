fetch("/api/auth", {
    method : "POST",
})

.then(response => response.json())

.then(async (data) => {
    const t = await tr;
    if (data.username) {
        const signin_status = document.getElementById("signin-status");
        signin_status.innerHTML = `<br><br>${t["common-signin-status"].replace("{user}", `<span style="color: #F16;">${data.username}</span>`)}`;

        const sign_wrapper = document.getElementById("sign-wrapper");
        sign_wrapper.innerHTML = "";

        const logout = document.createElement("button");
        logout.textContent = t["common-log-out"];

        logout.addEventListener("click", async () => {
            await fetch("/api/logout", {
                method : "POST",
            });
            window.location.reload();
        });

        sign_wrapper.appendChild(logout);

        const upload = document.createElement("button");
        upload.textContent = t["common-upload"];

        upload.addEventListener("click", async () => {
            const posts = document.getElementById("posts");
            posts.innerHTML = "";
            posts.style["flex-direction"] = "column";

            const a = document.createElement("a");
            a.style.color = "#000";
            a.style["margin-bottom"] = "15px";
            a.innerHTML = `&laquo;&nbsp;${t["common-back"]}`;
            a.href = "javascript:window.location.reload();";

            posts.appendChild(a);

            const form = document.createElement("form");
            form.style.width = "400px";
            form.method = "POST";
            form.enctype = "multipart/form-data";

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                const formData = new FormData(form);

                try {
                    await fetch("/api/upload", {
                        method : "POST",
                        body   : formData,
                    });
                    window.location.reload();
                } catch(err) {
                    console.error(err);
                    alert(t["common-upload-fail"]);
                }
            });

            const input = document.createElement("input");
            input.type = "file";
            input.name = "post";
            input.style.width = "300px";
            form.appendChild(input);

            const submit = document.createElement("input");
            submit.type = "submit";
            submit.value = t["common-submit"];
            form.appendChild(submit);

            // ::file-selector-button needs to use i18n somehow

            posts.appendChild(form);
        });

        sign_wrapper.appendChild(upload);
    } else {
        const sign_form = document.getElementById("sign-form");
        sign_form.style.display = "unset";

        const signin_button = document.getElementById("signin-button");
        const signup_button = document.getElementById("signup-button");
        const auth_status = document.getElementById("auth-status");

        signin_button.addEventListener("click", async (event) => {
            event.preventDefault();

            const formData = new FormData(sign_form);
            const username = formData.get("username");
            const password = formData.get("password");

            await fetch("/api/signin", {
                method  : "POST",
                headers : {
                    "Content-Type": "application/json",
                },
                body    : JSON.stringify({
                    username : username,
                    password : password,
                }),
            })

            .then((response) => {
                return response.json();
            })

            .then((data) => {
                if (data.status === 200) {
                    auth_status.textContent = t["auth-success"];
                    window.location.reload();
                } else if (data.status === 500) {
                    auth_status.textContent = t["auth-fail-server"];
                } else {
                    auth_status.textContent = t["auth-fail-incorrect"];
                }
            });
        });

        signup_button.addEventListener("click", async (event) => {
            event.preventDefault();

            const formData = new FormData(sign_form);
            const username = formData.get("username");
            const password = formData.get("password");

            await fetch("/api/signup", {
                method  : "POST",
                headers : {
                    "Content-Type": "application/json",
                },
                body    : JSON.stringify({
                    username: username,
                    password: password,
                })
            })

            .then((response) => {
                return response.json();
            })

            .then((data) => {
                auth_status.textContent = data.response;
                if (data.status === 201) {
                    window.location.reload();
                }
            });
        });
    }
});