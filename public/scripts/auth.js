fetch("/api/auth", {
    method : "POST",
})

.then(response => response.json())

.then((data) => {
    if (data.username) {
        const signin_status = document.getElementById("signin-status");
        signin_status.innerHTML = `<br><br>You are currently signed in as <span style="color: #F16;">${escape(data.username)}</span>.`;

        const sign_wrapper = document.getElementById("sign-wrapper");
        sign_wrapper.innerHTML = "";

        const logout = document.createElement("button");
        logout.textContent = "log out";

        logout.addEventListener("click", async () => {
            await fetch("/api/logout", {
                method : "POST",
            });
            window.location.reload();
        });

        sign_wrapper.appendChild(logout);

        const upload = document.createElement("button");
        upload.textContent = "upload";

        upload.addEventListener("click", async () => {
            const posts = document.getElementById("posts");
            posts.innerHTML = "";
            posts.style["flex-direction"] = "column";

            const a = document.createElement("a");
            a.style.color = "#000";
            a.style["margin-bottom"] = "15px";
            a.innerHTML = "&laquo;&nbsp;back";
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
                    alert("The file could not be uploaded.");
                }
            });

            const input = document.createElement("input");
            input.type = "file";
            input.name = "post";
            input.style.width = "300px";
            form.appendChild(input);

            const submit = document.createElement("input");
            submit.type = "submit";
            submit.value = "submit";
            form.appendChild(submit);

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
                    auth_status.textContent = "Authentication successful.";
                    window.location.reload();
                } else if (data.status === 500) {
                    auth_status.textContent = "Internal server error. Please try again later.";
                } else {
                    auth_status.textContent = "Incorrect username or password.";
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