let products = [];
let cart = [];
let checkoutModal = null;
let cartModal = null;

function formatPrice(price) {
    const number = parseFloat(price);
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showToast(message) {
    const toastBody = document.getElementById('toast-body-content');
    const toastEl = document.getElementById('cart-toast');
    if (toastBody && toastEl) {
        toastBody.textContent = message;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
}

function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        cartBadge.textContent = cart.length;
    }
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        let cartHTML = '<ul class="list-group">';
        let subtotal = 0;

        cart.forEach((product, index) => {
            cartHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="my-0">${product.name}</h6>
                        <small class="text-muted">Price: GHS ${formatPrice(product.price)}</small>
                    </div>
                    <button class="btn btn-danger btn-sm remove-from-cart-btn" data-product-index="${index}">Remove</button>
                </li>
            `;
            subtotal += parseFloat(product.price);
        });

        cartHTML += '</ul>';
        cartHTML += `<div class="text-end fw-bold mt-3">Subtotal: GHS ${formatPrice(subtotal)}</div>`;
        cartItemsContainer.innerHTML = cartHTML;
    }
}

function addToCart(productName) {
    const product = products.find(p => p.name === productName);
    if (product) {
        cart.push(product);
        updateCartBadge();
        renderCartItems();
        showToast(`${product.name} has been added to your cart.`);
    }
}

function removeFromCart(productIndex) {
    if (productIndex >= 0 && productIndex < cart.length) {
        cart.splice(productIndex, 1);
        updateCartBadge();
        renderCartItems();
    }
}

function openCheckoutModal(productName, productPrice) {
    const productNameInput = document.getElementById('product-name-input');
    const productPriceInput = document.getElementById('product-price-input');
    
    if (productNameInput && productPriceInput) {
        productNameInput.value = productName;
        productPriceInput.value = productPrice;
    }

    if (!checkoutModal) {
        const checkoutModalElement = document.getElementById('checkoutModal');
        if (checkoutModalElement) {
            checkoutModal = new bootstrap.Modal(checkoutModalElement);
        }
    }

    if (checkoutModal) {
        checkoutModal.show();
    }
}

function renderProducts(productsToRender) {
    const productGrid = document.getElementById("product-grid");
    const noResults = document.getElementById("no-results");

    if (productGrid) {
        productGrid.innerHTML = ''; // Clear existing products
        if (productsToRender.length === 0) {
            if(noResults) noResults.classList.remove('d-none');
        } else {
            if(noResults) noResults.classList.add('d-none');
            productsToRender.forEach(product => {
                const productCardHTML = `
                    <div class="col-md-4 mb-4">
                        <div class="card product-card h-100">
                            <img src="${product.image}" class="card-img-top" alt="${product.name}">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${product.name}</h5>
                                <p class="card-text">${product.description}</p>
                                <p class="card-text fw-bold mt-auto">GHS ${formatPrice(product.price)}</p>
                                <button class="btn btn-primary add-to-cart-btn" data-product-name="${product.name}">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                `;
                productGrid.innerHTML += productCardHTML;
            });
        }
    }
}

function renderFeaturedProducts() {
    const carouselInner = document.getElementById("product-carousel-inner");
    if (carouselInner) {
        carouselInner.innerHTML = '';
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
                                    <button class="btn btn-primary add-to-cart-btn" data-product-name="${product.name}">Add to Cart</button>
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
    if (!form) return false;
    const formData = new FormData(form);
    try {
        const response = await fetch(formspreeEndpoint, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        if (response.ok) return true;
        const data = await response.json();
        if (Object.hasOwn(data, 'errors')) {
            alert(data["errors"].map(error => error["message"]).join(", "));
        } else {
            alert('Oops! There was a problem submitting your form.');
        }
        return false;
    } catch (error) {
        alert('Oops! There was a problem submitting your form.');
        console.error(error);
        return false;
    }
}

function payWithPaystack(email, name, price, productName, checkoutForm) {
    const handler = PaystackPop.setup({
        key: 'pk_test_2fe8bb5c19b3f8662419607eefb26aa6380c5fe7',
        email: email,
        amount: parseFloat(price) * 100,
        currency: 'GHS',
        ref: '' + Math.floor((Math.random() * 1000000000) + 1),
        callback: function(response) {
            const templateParams = {
                name: name,
                product_name: productName,
                product_price: formatPrice(price),
                transaction_ref: response.reference,
                email: email
            };
            emailjs.send('service_arfu1ks', 'template_9hh7e6q', templateParams)
                .then(function(emailResponse) {
                    alert('Payment successful! A confirmation email has been sent to you.');
                }, function(error) {
                    alert('Payment successful, but we failed to send a confirmation email. Error: ' + JSON.stringify(error));
                })
                .finally(() => {
                    if (checkoutModal) checkoutModal.hide();
                    if (checkoutForm) checkoutForm.reset();
                });
        },
        onClose: function() {
            alert('Payment window closed.');
        }
    });
    handler.openIframe();
}

document.addEventListener("DOMContentLoaded", () => {
    emailjs.init('2x9OXBEHSO9gJUvwv');

    const checkoutModalElement = document.getElementById('checkoutModal');
    if (checkoutModalElement) {
        checkoutModal = new bootstrap.Modal(checkoutModalElement);
    }

    const cartModalElement = document.getElementById('cartModal');
    if (cartModalElement) {
        cartModal = new bootstrap.Modal(cartModalElement);
    }

    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            renderFeaturedProducts();
            filterAndRenderProducts(); // Render all products on load
        })
        .catch(error => console.error('Error fetching products:', error));

    // DARK MODE
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const enableDarkMode = () => { body.classList.add('dark-mode'); localStorage.setItem('darkMode', 'enabled'); };
    const disableDarkMode = () => { body.classList.remove('dark-mode'); localStorage.setItem('darkMode', 'disabled'); };
    if (localStorage.getItem('darkMode') === 'enabled') enableDarkMode(); else disableDarkMode();
    if(darkModeToggle) darkModeToggle.addEventListener('click', () => body.classList.contains('dark-mode') ? disableDarkMode() : enableDarkMode());

    // EVENT LISTENERS
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productName = e.target.dataset.productName;
            addToCart(productName);
        }

        if (e.target.classList.contains('remove-from-cart-btn')) {
            const productIndex = e.target.dataset.productIndex;
            removeFromCart(productIndex);
        }
    });

    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            if (cartModal) {
                renderCartItems();
                cartModal.show();
            }
        });
    }

    const payNowBtn = document.getElementById('pay-now-btn');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm && checkoutForm.checkValidity()) {
                const formSubmitted = await submitFormToFormspree(checkoutForm, 'https://formspree.io/f/mblnnppl');
                if (formSubmitted) {
                    const name = document.getElementById('checkout_fullName').value;
                    const email = document.getElementById('checkout_email').value;
                    const price = document.getElementById('product-price-input').value;
                    const productName = document.getElementById('product-name-input').value;
                    payWithPaystack(email, name, price, productName, checkoutForm);
                }
            } else if (checkoutForm) {
                checkoutForm.reportValidity();
            }
        });
    }

    // Generic form submission for contact and newsletter
    const handleFormSubmit = async (form, endpoint, statusDiv) => {
        if (form.checkValidity()) {
            const formSubmitted = await submitFormToFormspree(form, endpoint);
            statusDiv.innerHTML = formSubmitted 
                ? '<div class="alert alert-success">Thank you for your message!</div>'
                : '<div class="alert alert-danger">Oops! There was a problem.</div>';
            if(formSubmitted) form.reset();
        } else {
            form.reportValidity();
        }
    };

    const contactForm = document.getElementById('contact-form');
    if(contactForm) contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(contactForm, 'https://formspree.io/f/xzznlrjz', document.getElementById('contact-form-status'));
    });

    const newsletterForm = document.getElementById('newsletter-form');
    if(newsletterForm) newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(newsletterForm, 'https://formspree.io/f/mqarvqwr', document.getElementById('newsletter-form-status'));
    });

    // Product page specific logic
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-products');
    if(searchInput) searchInput.addEventListener('input', filterAndRenderProducts);
    if(sortSelect) sortSelect.addEventListener('change', filterAndRenderProducts);
});

function filterAndRenderProducts() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-products');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const sortBy = sortSelect ? sortSelect.value : 'default';

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
