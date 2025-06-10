import { i18n, tr } from './common';

interface AuthResponse {
    status    : number;
    username? : string;
    is_admin? : boolean;
    user_id?  : number;
    is_full?  : boolean;
}

interface SignInResponse {
    status    : number;
    response? : string;
    username? : string;
    is_admin? : boolean;
    user_id?  : number;
    is_full?  : boolean;
}

interface SignUpResponse {
    status    : number;
    response? : string;
}

let auth_ready = new Promise<void>((res) => {
    fetch("/api/auth", {
        method: "POST",
    })
    .then(response => response.json())
    .then(async (data: AuthResponse) => {
        const t = await tr;
        if (data.username) {
            const signin_status = document.getElementById("signin-status");
            if (signin_status) {
                signin_status.innerHTML = `<br><br>${t["common-signin-status"].replace("{user}", `<span style="color: #F16;">${data.username}</span>`)}`;
                signin_status.lang = i18n.current_lang;
            }

            const sign_wrapper = document.getElementById("sign-wrapper");
            if (sign_wrapper) {
                sign_wrapper.innerHTML = "";

                const logout = document.createElement("button");
                logout.textContent = t["common-log-out"];
                logout.lang = i18n.current_lang;

                logout.addEventListener("click", async () => {
                    await fetch("/api/logout", {
                        method: "POST",
                    });
                    window.location.reload();
                });

                sign_wrapper.appendChild(logout);

                const upload = document.createElement("button");
                upload.textContent = t["common-upload"];
                upload.lang = i18n.current_lang;

                upload.addEventListener("click", async () => {
                    const posts = document.getElementById("posts");
                    if (!posts) return;
                    
                    posts.innerHTML = "";
                    posts.style.flexDirection = "column";

                    const a = document.createElement("a");
                    a.style.color = "#000";
                    a.style.marginBottom = "15px";
                    a.innerHTML = `&laquo;&nbsp;${t["common-back"]}`;
                    a.lang = i18n.current_lang;
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
                                method: "POST",
                                body: formData,
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
                    submit.lang = i18n.current_lang;
                    form.appendChild(submit);

                    posts.appendChild(form);
                });

                sign_wrapper.appendChild(upload);
            }
        } else {
            const sign_form = document.getElementById("sign-form") as HTMLFormElement;
            if (sign_form) {
                sign_form.style.display = "unset";

                const signin_button = document.getElementById("signin-button") as HTMLInputElement;
                if (signin_button) {
                    signin_button.value = t["common-sign-in"];
                    signin_button.lang = i18n.current_lang;
                }

                const signup_button = document.getElementById("signup-button") as HTMLInputElement;
                if (signup_button) {
                    signup_button.value = t["common-sign-up"];
                    signup_button.lang = i18n.current_lang;
                }

                const auth_status = document.getElementById("auth-status");
                if (auth_status) {
                    if (signin_button) {
                        signin_button.addEventListener("click", async (event) => {
                            event.preventDefault();

                            const formData = new FormData(sign_form);
                            const username = formData.get("username") as string;
                            const password = formData.get("password") as string;

                            try {
                                const response = await fetch("/api/signin", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        username,
                                        password,
                                    }),
                                });

                                const data: SignInResponse = await response.json();
                                if (data.status === 200) {
                                    auth_status.textContent = t["auth-success"];
                                    auth_status.lang = i18n.current_lang;
                                    window.location.reload();
                                } else if (data.status === 500) {
                                    auth_status.textContent = t["auth-fail-server"];
                                    auth_status.lang = i18n.current_lang;
                                } else {
                                    auth_status.textContent = t["auth-fail-incorrect"];
                                    auth_status.lang = i18n.current_lang;
                                }
                            } catch (err) {
                                console.error(err);
                                auth_status.textContent = t["auth-fail-server"];
                                auth_status.lang = i18n.current_lang;
                            }
                        });
                    }

                    if (signup_button) {
                        signup_button.addEventListener("click", async (event) => {
                            event.preventDefault();

                            const formData = new FormData(sign_form);
                            const username = formData.get("username") as string;
                            const password = formData.get("password") as string;

                            try {
                                const response = await fetch("/api/signup", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        username,
                                        password,
                                    }),
                                });

                                const data: SignUpResponse = await response.json();
                                auth_status.textContent = data.response ?? null;
                                if (data.status === 201) {
                                    window.location.reload();
                                }
                            } catch (err) {
                                console.error(err);
                                auth_status.textContent = t["auth-fail-server"];
                                auth_status.lang = i18n.current_lang;
                            }
                        });
                    }
                }
            }
        }
        res();
    });
});

export { auth_ready }; 