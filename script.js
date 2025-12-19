let products = [];

function formatPrice(price) {
    const number = parseFloat(price);
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function openCheckoutModal(productName, productPrice) {
    const productNameInput = document.getElementById('product-name-input');
    const productPriceInput = document.getElementById('product-price-input');
    const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));

    productNameInput.value = productName;
    productPriceInput.value = productPrice;
    checkoutModal.show();
}

function renderProducts(productsToRender) {
    const productGrid = document.getElementById("product-grid");
    const noResults = document.getElementById("no-results");

    productGrid.innerHTML = ''; // Clear existing products

    if (productsToRender.length === 0) {
        noResults.classList.remove('d-none');
    } else {
        noResults.classList.add('d-none');
        productsToRender.forEach(product => {
            const productCardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card product-card h-100">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text fw-bold mt-auto">GHS ${formatPrice(product.price)}</p>
                            <button class="btn btn-primary buy-now-btn" data-product-name="${product.name}" data-product-price="${product.price}">Buy Now</button>
                        </div>
                    </div>
                </div>
            `;
            productGrid.innerHTML += productCardHTML;
        });
    }
}

function renderFeaturedProducts() {
    const carouselInner = document.getElementById("product-carousel-inner");
    if (carouselInner) {
        carouselInner.innerHTML = ''; // Clear existing items
        const featuredProducts = products.filter(p => p.featured);
        featuredProducts.forEach((product, index) => {
            const activeClass = index === 0 ? "active" : "";
            const carouselItem = `
                <div class="carousel-item ${activeClass}">
                    <div class="row justify-content-center">
                        <div class="col-md-8">
                             <div class="card product-card">
                                <img src="${product.image}" class="card-img-top" alt="${product.name}">
                                <div class="card-body text-center">
                                    <h5 class="card-title">${product.name}</h5>
                                    <p class="card-text">${product.description}</p>
                                    <p class="card-text fw-bold">GHS ${formatPrice(product.price)}</p>
                                    <button class="btn btn-primary buy-now-btn" data-product-name="${product.name}" data-product-price="${product.price}">Purchase Now</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            carouselInner.innerHTML += carouselItem;
        });
    }
}

async function submitFormToFormspree(form, formspreeEndpoint) {
    const formAction = formspreeEndpoint;
    const formData = new FormData(form);

    try {
        const response = await fetch(formAction, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            return true; // Submission successful
        } else {
            const data = await response.json();
            if (Object.hasOwn(data, 'errors')) {
                alert(data["errors"].map(error => error["message"]).join(", "));
            } else {
                alert('Oops! There was a problem submitting your form.');
            }
            return false; // Submission failed
        }
    } catch (error) {
        alert('Oops! There was a problem submitting your form.');
        console.error(error);
        return false; // Submission failed
    }
}

function payWithPaystack(orderDetails) {
    const handler = PaystackPop.setup({
        key: 'pk_test_2fe8bb5c19b3f8662419607eefb26aa6380c5fe7', // Replace with your public key
        email: orderDetails.email,
        amount: parseFloat(orderDetails.price) * 100, // amount is in pesewas
        currency: 'GHS',
        ref: '' + Math.floor((Math.random() * 1000000000) + 1),
        callback: function(response) {
            // Payment successful, now send confirmation email
            const templateParams = {
                to_name: orderDetails.name,
                product_name: orderDetails.productName,
                product_price: formatPrice(orderDetails.price),
                transaction_ref: response.reference,
                to_email: orderDetails.email
            };

            emailjs.send('service_arfu1ks', 'template_9hh7e6q', templateParams)
                .then(function(emailResponse) {
                    console.log('SUCCESS!', emailResponse.status, emailResponse.text);
                    alert('Payment successful! A confirmation email has been sent to you.');
                }, function(error) {
                    console.log('FAILED...', error);
                    alert('Payment successful, but we failed to send a confirmation email. Please contact support with your transaction reference: ' + response.reference);
                });
        },
        onClose: function() {
            alert('Payment window closed.');
        }
    });
    handler.openIframe();
}

document.addEventListener("DOMContentLoaded", () => {
    // Initialize EmailJS
    emailjs.init('2x9OXBEHSO9gJUvwv');

    // Fetch product data
    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            // DARK MODE
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

            // Check for saved user preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                enableDarkMode();
            } else {
                disableDarkMode();
            }

            // Toggle dark mode on button click
            darkModeToggle.addEventListener('click', () => {
                if (body.classList.contains('dark-mode')) {
                    disableDarkMode();
                } else {
                    enableDarkMode();
                }
            });

            renderFeaturedProducts();
            const carousel = document.getElementById('productCarousel');
            if (carousel) {
                carousel.addEventListener('click', (e) => {
                    if (e.target.classList.contains('buy-now-btn')) {
                        const productName = e.target.dataset.productName;
                        const productPrice = e.target.dataset.productPrice;
                        openCheckoutModal(productName, productPrice);
                    }
                });
            }

            const productGrid = document.getElementById('product-grid');
            if (productGrid) {
                const searchInput = document.getElementById('search-input');
                const sortSelect = document.getElementById('sort-products');

                function filterAndRenderProducts() {
                    const searchTerm = searchInput.value.toLowerCase();
                    const sortBy = sortSelect.value;

                    let filteredProducts = products.filter(product =>
                        product.name.toLowerCase().includes(searchTerm)
                    );

                    if (sortBy === 'price-asc') {
                        filteredProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    } else if (sortBy === 'price-desc') {
                        filteredProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                    } else if (sortBy === 'name-asc') {
                        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                    } else if (sortBy === 'name-desc') {
                        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                    }

                    renderProducts(filteredProducts);
                }

                // Initial Render
                filterAndRenderProducts();

                // Event Listeners
                searchInput.addEventListener('input', filterAndRenderProducts);
                sortSelect.addEventListener('change', filterAndRenderProducts);

                productGrid.addEventListener('click', (e) => {
                    if (e.target.classList.contains('buy-now-btn')) {
                        const productName = e.target.dataset.productName;
                        const productPrice = e.target.dataset.productPrice;
                        openCheckoutModal(productName, productPrice);
                    }
                });
            }
        })
        .catch(error => console.error('Error fetching products:', error));

    const payNowBtn = document.getElementById('pay-now-btn');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm.checkValidity()) {
                // submit the form to formspree
                const formSubmitted = await submitFormToFormspree(checkoutForm, 'https://formspree.io/f/mblnnppl');

                if (formSubmitted) {
                    const orderDetails = {
                        name: document.getElementById('fullName').value,
                        email: document.getElementById('email').value,
                        price: document.getElementById('product-price-input').value,
                        productName: document.getElementById('product-name-input').value
                    };
                    
                    payWithPaystack(orderDetails);

                    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
                    checkoutModal.hide();
                    checkoutForm.reset();
                }
            } else {
                checkoutForm.reportValidity();
            }
        });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusDiv = document.getElementById('contact-form-status');
            if (contactForm.checkValidity()) {
                const formSubmitted = await submitFormToFormspree(contactForm, 'https://formspree.io/f/xzznlrjz');
                if (formSubmitted) {
                    statusDiv.innerHTML = '<div class="alert alert-success">Thank you for your message!</div>';
                    contactForm.reset();
                } else {
                    statusDiv.innerHTML = '<div class="alert alert-danger">Oops! There was a problem sending your message.</div>';
                }
            } else {
                contactForm.reportValidity();
            }
        });
    }

    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusDiv = document.getElementById('newsletter-form-status');
            if (newsletterForm.checkValidity()) {
                const formSubmitted = await submitFormToFormspree(newsletterForm, 'https://formspree.io/f/mqarvqwr');
                if (formSubmitted) {
                    statusDiv.innerHTML = '<div class="alert alert-success">Thank you for subscribing!</div>';
                    newsletterForm.reset();
                } else {
                    statusDiv.innerHTML = '<div class="alert alert-danger">Oops! There was a problem subscribing.</div>';
                }
            } else {
                newsletterForm.reportValidity();
            }
        });
    }
});
