async function loadComponent(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            const parent = element.parentNode;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data;
            const componentElement = tempDiv.firstElementChild;
            parent.replaceChild(componentElement, element);

            if (componentElement.id === 'navbar') {
                const darkModeToggle = document.getElementById('darkModeToggle');
                const body = document.body;

                const enableDarkMode = () => {
                    body.classList.add('dark-mode');
                    localStorage.setItem('darkMode', 'enabled');
                };

                const disableDarkMode = () => {
                    body.classList.remove('dark-mode');
                    localStorage.setItem('darkMode', 'disabled');
                };

                if (localStorage.getItem('darkMode') === 'enabled') {
                    enableDarkMode();
                } else {
                    disableDarkMode();
                }

                if (darkModeToggle) {
                    darkModeToggle.addEventListener('click', () => {
                        if (body.classList.contains('dark-mode')) {
                            disableDarkMode();
                        } else {
                            enableDarkMode();
                        }
                    });
                }
                 // Update active nav link
                const currentPage = window.location.pathname.split('/').pop();
                const navLinks = componentElement.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    const linkPage = link.getAttribute('href').split('/').pop();
                    if (linkPage === currentPage) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        }
    } catch (error) {
        console.error(`Could not load component from ${url}:`, error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadComponent('navbar.html', 'navbar-container');
    loadComponent('footer.html', 'footer-container');
});
