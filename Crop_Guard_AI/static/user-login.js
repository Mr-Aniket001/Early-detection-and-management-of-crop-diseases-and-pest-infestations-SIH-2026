const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm?.addEventListener("submit", event => {
    event.preventDefault();

    const role = document.getElementById("role")?.value;
    const destinations = {
        farmer: "/farmer",
        expert: "/expert",
    };

    if (!role) {
        loginMessage.textContent = "Please select your role.";
        return;
    }

    if (!destinations[role]) {
        loginMessage.textContent = "The officer portal is not available yet.";
        return;
    }

    window.location.href = destinations[role];
});
