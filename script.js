
import { supabase } from './supabase-client.js';

const SHIPPING_COST = 50;
let products = [];
let cart = [];
let checkoutModal = null;

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

function addToCart(productName, productPrice) {
    const existingProduct = cart.find(item => item.name === productName);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ name: productName, price: productPrice, quantity: 1 });
    }
    updateCartBadge();
    showToast(`${productName} has been added to your cart.`);
    saveCartToLocalStorage();
}

function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }
}

function renderCartItems() {
    const cartContent = document.getElementById('cart-content');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const cartItemsColumn = document.getElementById('cart-items-column');
    const orderSummaryColumn = document.getElementById('order-summary-column');

    if (cart.length === 0) {
        if (cartContent) cartContent.classList.add('d-none');
        if (cartEmptyMessage) cartEmptyMessage.classList.remove('d-none');
    } else {
        if (cartContent) cartContent.classList.remove('d-none');
        if (cartEmptyMessage) cartEmptyMessage.classList.add('d-none');

        if (cartItemsColumn) {
            cartItemsColumn.innerHTML = cart.map(item => {
                const product = products.find(p => p.name === item.name);
                const itemImage = product ? product.image : 'https://via.placeholder.com/100';
                // Sanitize product name for use in data attributes
                const safeItemName = item.name.replace(/"/g, '&quot;');

                return `
                    <div class="card mb-3 shadow-sm cart-item-card">
                        <div class="row g-0">
                            <div class="col-md-3 d-flex align-items-center justify-content-center">
                                <img src="${itemImage}" class="img-fluid rounded-start cart-item-image" alt="${item.name}">
                            </div>
                            <div class="col-md-9">
                                <div class="card-body">
                                    <h5 class="card-title fw-bold">${item.name}</h5>
                                    <p class="card-text text-muted">Price: GHS ${formatPrice(item.price)}</p>
                                    <div class="d-flex align-items-center mt-3">
                                        <div class="input-group input-group-sm" style="width: 120px;">
                                            <button class="btn btn-outline-secondary cart-action-btn" type="button" data-action="decrement" data-product-name="${safeItemName}">-</button>
                                            <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                                            <button class="btn btn-outline-secondary cart-action-btn" type="button" data-action="increment" data-product-name="${safeItemName}">+</button>
                                        </div>
                                        <button class="btn btn-danger btn-sm ms-4 cart-action-btn" type="button" data-action="remove" data-product-name="${safeItemName}">
                                            <i class="bi bi-trash-fill"></i> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (orderSummaryColumn) {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shipping = SHIPPING_COST;
            const total = subtotal + shipping;

            orderSummaryColumn.innerHTML = `
                <div class="card shadow-sm">
                    <div class="card-body">
                        <h4 class="card-title fw-bold mb-4">Order Summary</h4>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Subtotal
                                <span>GHS ${formatPrice(subtotal)}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Shipping
                                <span>GHS ${formatPrice(shipping)}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center fw-bold fs-5">
                                Total
                                <span>GHS ${formatPrice(total)}</span>
                            </li>
                        </ul>
                        <div class="d-grid mt-4">
                            <button class="btn btn-primary btn-lg" id="checkout-btn">
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}


function incrementQuantity(productName) {
    const product = cart.find(item => item.name === productName);
    if (product) {
        product.quantity++;
    }
    updateCartBadge();
    renderCartItems();
    saveCartToLocalStorage();
}

function decrementQuantity(productName) {
    const product = cart.find(item => item.name === productName);
    if (product && product.quantity > 1) {
        product.quantity--;
    } else if (product) {
        removeFromCart(productName); // Automatically remove if quantity becomes 0
    }
    updateCartBadge();
    renderCartItems();
    saveCartToLocalStorage();
}

function removeFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);
    updateCartBadge();
    renderCartItems();
    saveCartToLocalStorage();
}


function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

function renderProducts(productsToRender) {
    const productGrid = document.getElementById("product-grid");
    const noResults = document.getElementById("no-results");

    if (productGrid) {
        productGrid.innerHTML = '';
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
                                <button class="btn btn-primary add-to-cart-btn" data-product-name="${product.name}" data-product-price="${product.price}">Add to Cart</button>
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
                                    <button class="btn btn-primary add-to-cart-btn" data-product-name="${product.name}" data-product-price="${product.price}">Add to Cart</button>
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
                    cart = [];
                    saveCartToLocalStorage();
                    updateCartBadge();
                    renderCartItems();
                });
        },
        onClose: function() {
            alert('Payment window closed.');
        }
    });
    handler.openIframe();
}

async function loadProducts() {
    let loadedProducts = [];
    try {
        // First, try to get products from Supabase
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        if (data && data.length > 0) {
            console.log('Products loaded from Supabase');
            loadedProducts = data;
        } else {
            // If Supabase returns no data, trigger the fallback
            throw new Error('No products in Supabase, falling back to JSON.');
        }
    } catch (error) {
        // If Supabase fails for any reason, log the error and try the local file
        console.warn(error.message);
        console.log('Attempting to load from local products.json.');
        try {
            const response = await fetch('products.json');
            if (!response.ok) {
                 throw new Error('Failed to fetch products.json');
            }
            loadedProducts = await response.json();
            console.log('Products successfully loaded from products.json.');
        } catch (jsonError) {
            // If both sources fail, log a critical error
            console.error('CRITICAL: Failed to load products from both Supabase and local JSON file.', jsonError.message);
        }
    }
    return loadedProducts;
}

document.addEventListener("DOMContentLoaded", async () => {
    // Load reusable components
    loadComponent('navbar.html', 'navbar-container');
    loadComponent('footer.html', 'footer-container');

    // Initialize services
    emailjs.init('2x9OXBEHSO9gJUvwv');
    
    // Setup modal
    const checkoutModalElement = document.getElementById('checkoutModal');
    if (checkoutModalElement) {
        checkoutModal = new bootstrap.Modal(checkoutModalElement);
    }
    
    // Load state
    loadCartFromLocalStorage();

    // CRITICAL: Await product loading before proceeding
    products = await loadProducts();

    // Now that products are loaded, render all page components that depend on them
    updateCartBadge();
    renderCartItems();
    renderFeaturedProducts();
    filterAndRenderProducts(); // Initial render for product lists

    // --- All event listeners should be set up after initial rendering ---

    // Centralized event listener for all body clicks
    document.body.addEventListener('click', (e) => {
        // Add to Cart button
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productName = e.target.dataset.productName;
            const productPrice = e.target.dataset.productPrice;
            addToCart(productName, productPrice);
            return; // Exit after handling
        }

        // Cart action buttons (Increment, Decrement, Remove)
        const cartButton = e.target.closest('.cart-action-btn');
        if (cartButton) {
            const productName = cartButton.dataset.productName;
            const action = cartButton.dataset.action;

            if (action === 'increment') {
                incrementQuantity(productName);
            } else if (action === 'decrement') {
                decrementQuantity(productName);
            } else if (action === 'remove') {
                removeFromCart(productName);
            }
            return; // Exit after handling
        }

        // Checkout button
        if (e.target.id === 'checkout-btn') {
            if(checkoutModalElement) {
                 if (!checkoutModal) {
                    checkoutModal = new bootstrap.Modal(checkoutModalElement);
                }
                checkoutModal.show();
            }
        }
    });


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
                    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const total = subtotal + SHIPPING_COST;
                    const productName = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');
                    payWithPaystack(email, name, total, productName, checkoutForm);
                }
            } else if (checkoutForm) {
                checkoutForm.reportValidity();
            }
        });
    }

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
