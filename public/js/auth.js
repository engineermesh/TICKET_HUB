const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const form = registerForm || loginForm;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.getElementById("message");
  const data = Object.fromEntries(new FormData(form).entries());
  const endpoint = registerForm ? "/api/auth/register" : "/api/auth/login";
  message.textContent = "Please wait…";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed.");
    if (result.token) {
      localStorage.setItem("tickethub_token", result.token);
      localStorage.setItem("tickethub_user", JSON.stringify(result.user));
      location.href = "/my-tickets.html";
    } else {
      message.textContent = "Account created. You can now log in.";
      form.reset();
    }
  } catch (error) { message.textContent = error.message; }
});
