document.addEventListener('DOMContentLoaded', function () {
    const logoutLinks = document.querySelectorAll('.logout');

    logoutLinks.forEach(function (logoutLink) {
        logoutLink.addEventListener('click', function (event) {
            event.preventDefault();
            const confirmation = confirm('Are you sure you want to logout?');
            if (confirmation) {
                window.location.href = logoutLink.getAttribute('href');
            }
        });
    });
});