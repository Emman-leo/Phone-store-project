
import { supabase } from './supabase-client.js';

const SHIPPING_COST = 50;
const CURRENCY = 'GHS';
let products = [];
let cart = [];
let wishlist = [];
let checkoutModal = null;
let sideCart = null;

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

function toggleWishlist(productName) {
    const index = wishlist.indexOf(productName);
    if (index === -1) {
        wishlist.push(productName);
        showToast(`${productName} added to wishlist!`);
    } else {
        wishlist.splice(index, 1);
        showToast(`${productName} removed from wishlist.`);
    }
    saveWishlistToLocalStorage();
    updateWishlistBadge();
    
    // Re-render if we are on the wishlist page
    if (window.location.pathname.includes('wishlist.html')) {
        renderWishlistPage();
    } else {
        // Just update icons on current page
        const buttons = document.querySelectorAll(`.wishlist-btn[data-product-name="${productName}"]`);
        buttons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (wishlist.includes(productName)) {
                btn.classList.add('active');
                icon.classList.remove('bi-heart');
                icon.classList.add('bi-heart-fill');
            } else {
                btn.classList.remove('active');
                icon.classList.remove('bi-heart-fill');
                icon.classList.add('bi-heart');
            }
        });
    }
}

function updateWishlistBadge() {
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
        badge.textContent = wishlist.length;
        if (wishlist.length > 0) {
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }
}

function saveWishlistToLocalStorage() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function loadWishlistFromLocalStorage() {
    const stored = localStorage.getItem('wishlist');
    if (stored) {
        wishlist = JSON.parse(stored);
    }
}


function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartBadge.textContent = totalItems;
        
        // Add pulse animation
        cartBadge.classList.remove('badge-pulse');
        void cartBadge.offsetWidth; // Trigger reflow
        cartBadge.classList.add('badge-pulse');
    }
    renderSideCart();
}

function renderSideCart() {
    const sideCartItems = document.getElementById('side-cart-items');
    const sideCartEmpty = document.getElementById('side-cart-empty');
    const sideCartFooter = document.getElementById('side-cart-footer');
    const sideCartTotal = document.getElementById('side-cart-total');

    if (!sideCartItems) return;

    if (cart.length === 0) {
        sideCartItems.innerHTML = '';
        sideCartEmpty.classList.remove('d-none');
        sideCartFooter.classList.add('d-none');
    } else {
        sideCartEmpty.classList.add('d-none');
        sideCartFooter.classList.remove('d-none');

        sideCartItems.innerHTML = cart.map(item => {
            const product = products.find(p => p.name === item.name);
            const itemImage = product ? product.image : 'https://via.placeholder.com/100';
            const safeItemName = item.name.replace(/"/g, '&quot;');

            return `
                <div class="side-cart-item">
                    <img src="${itemImage}" class="side-cart-img" alt="${item.name}">
                    <div class="side-cart-info">
                        <div class="side-cart-name">${item.name}</div>
                        <div class="side-cart-price">${CURRENCY} ${formatPrice(item.price)}</div>
                        <div class="side-cart-actions">
                            <div class="side-cart-qty-pill">
                                <button class="cart-action-btn" data-action="decrement" data-product-name="${safeItemName}">-</button>
                                <span>${item.quantity}</span>
                                <button class="cart-action-btn" data-action="increment" data-product-name="${safeItemName}">+</button>
                            </div>
                            <button class="btn btn-link text-danger p-0 cart-action-btn" data-action="remove" data-product-name="${safeItemName}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        sideCartTotal.textContent = `${CURRENCY} ${formatPrice(subtotal)}`;
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
                                    <p class="card-text text-muted">Price: ${CURRENCY} ${formatPrice(item.price)}</p>
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
                                <span>${CURRENCY} ${formatPrice(subtotal)}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                Shipping
                                <span>${CURRENCY} ${formatPrice(shipping)}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between align-items-center fw-bold fs-5">
                                Total
                                <span>${CURRENCY} ${formatPrice(total)}</span>
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
                const categoryBadge = product.category ? `<span class="badge bg-secondary mb-2">${product.category}</span>` : '';
                const isWishlisted = wishlist.includes(product.name);
                const wishlistIcon = isWishlisted ? 'bi-heart-fill' : 'bi-heart';
                const wishlistClass = isWishlisted ? 'active' : '';

                const productCardHTML = `
                    <div class="col-md-4 mb-4">
                        <div class="card product-card h-100">
                            <button class="wishlist-btn ${wishlistClass}" data-product-name="${product.name}" title="Add to Wishlist">
                                <i class="bi ${wishlistIcon}"></i>
                            </button>
                            <img src="${product.image}" class="card-img-top" alt="${product.name}">
                            <div class="card-body d-flex flex-column">
                                ${categoryBadge}
                                <h5 class="card-title">${product.name}</h5>
                                <p class="card-text">${product.description}</p>
                                <p class="card-text fw-bold mt-auto">${CURRENCY} ${formatPrice(product.price)}</p>
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
            const isWishlisted = wishlist.includes(product.name);
            const wishlistIcon = isWishlisted ? 'bi-heart-fill' : 'bi-heart';
            const wishlistClass = isWishlisted ? 'active' : '';

            const carouselItem = `
                <div class="carousel-item ${activeClass}">
                    <div class="row justify-content-center">
                        <div class="col-md-8">
                             <div class="card product-card">
                                <button class="wishlist-btn ${wishlistClass}" data-product-name="${product.name}" title="Add to Wishlist">
                                    <i class="bi ${wishlistIcon}"></i>
                                </button>
                                <img src="${product.image}" class="card-img-top" alt="${product.name}">
                                <div class="card-body text-center">
                                    <h5 class="card-title">${product.name}</h5>
                                    <p class="card-text">${product.description}</p>
                                    <p class="card-text fw-bold">${CURRENCY} ${formatPrice(product.price)}</p>
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
            console.error('Formspree errors:', data["errors"]);
        } else {
            console.error('Formspree submission error:', data);
        }
        return false;
    } catch (error) {
        console.error('Error submitting form to Formspree:', error);
        return false;
    }
}

async function handleSuccessfulPayment(response, name, email, phone, address, price, cartItems, checkoutForm) {
    console.log('Payment successful. Reference: ' + response.reference);

    const payNowBtn = document.getElementById('pay-now-btn');
    if (payNowBtn) {
        payNowBtn.classList.remove('checkout-processing');
        payNowBtn.disabled = false;
    }

    // Show Success Animation
    const modalBody = document.getElementById('checkoutModalBody');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="success-animation-container">
                <div class="success-icon">
                    <i class="bi bi-check-lg"></i>
                </div>
                <h3 class="fw-bold mb-3">Order Placed!</h3>
                <p class="text-muted mb-4">Thank you for your purchase, ${name}. We've sent a confirmation email to ${email}.</p>
                <button type="button" class="btn btn-primary rounded-pill px-5" data-bs-dismiss="modal">Sweet!</button>
            </div>
        `;
        
        // Fire Confetti!
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#818cf8', '#fbbf24', '#34d399'],
                zIndex: 9999
            });
        }
    }

    const orderData = {
        name: name,
        email: email,
        phone: phone,
        address: address,
        products: cartItems,
        total_amount: price,
        transaction_ref: response.reference
    };

    try {
        const { data, error } = await supabase.from('orders').insert([orderData]);
        if (error) {
            throw error;
        }
        console.log('Order saved to Supabase:', data);

    } catch (error) {
        console.error('Error saving order to Supabase:', error);
    }

    await submitFormToFormspree(checkoutForm, 'https://formspree.io/f/mblnnppl');

    const productNameString = cartItems.map(item => `${item.name} (x${item.quantity})`).join(', ');
    const templateParams = {
        name: name,
        product_name: productNameString,
        product_price: formatPrice(price),
        transaction_ref: response.reference,
        email: email
    };

    emailjs.send('service_arfu1ks', 'template_9hh7e6q', templateParams)
        .then(function(emailResponse) {
            console.log('Confirmation email sent successfully.', emailResponse.status, emailResponse.text);
        }, function(error) {
            console.error('Failed to send confirmation email.', error);
        });

    if (checkoutForm) checkoutForm.reset();
    cart = [];
    saveCartToLocalStorage();
    updateCartBadge();
    if (document.getElementById('cart-items-column')) {
        renderCartItems();
    }
}

async function payWithPaystack(email, name, phone, address, price, cartItems, checkoutForm) {
    const payNowBtn = document.getElementById('pay-now-btn');
    if (payNowBtn) {
        payNowBtn.classList.add('checkout-processing');
        payNowBtn.disabled = true;
    }

    const handler = PaystackPop.setup({
        key: 'pk_test_2fe8bb5c19b3f8662419607eefb26aa6380c5fe7', // Replace with your public key
        email: email,
        amount: parseFloat(price) * 100, // Amount in kobo
        currency: CURRENCY,
        ref: '' + Math.floor((Math.random() * 1000000000) + 1), // Unique ref
        callback: function(response) {
            handleSuccessfulPayment(response, name, email, phone, address, price, cartItems, checkoutForm);
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
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }
        if (data && data.length > 0) {
            console.log('Products loaded from Supabase');
            loadedProducts = data;
        } else {
            throw new Error('No products in Supabase, falling back to JSON.');
        }
    } catch (error) {
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
            console.error('CRITICAL: Failed to load products from both Supabase and local JSON file.', jsonError.message);
        }
    }
    return loadedProducts;
}

// Handle Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    }
});

function renderProductSkeletons(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
            <div class="col-md-4 mb-4">
                <div class="skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 70%"></div>
                    <div class="skeleton skeleton-price"></div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            </div>
        `;
    }
    container.innerHTML = skeletonHTML;
}

function handleSearchSuggestions(e) {
    const term = e.target.value.toLowerCase().trim();
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (!suggestionsContainer) return;

    if (term.length < 2) {
        suggestionsContainer.classList.add('d-none');
        return;
    }

    const matches = products.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.category && p.category.toLowerCase().includes(term))
    ).slice(0, 6); // Max 6 suggestions

    if (matches.length > 0) {
        suggestionsContainer.innerHTML = matches.map(p => `
            <div class="suggestion-item" data-product-name="${p.name}">
                <img src="${p.image}" class="suggestion-img" alt="${p.name}">
                <div class="suggestion-info">
                    <p class="suggestion-name">${p.name}</p>
                    <span class="suggestion-category">${p.category || 'Gadget'}</span>
                </div>
                <div class="suggestion-price">${CURRENCY} ${formatPrice(p.price)}</div>
            </div>
        `).join('');
        suggestionsContainer.classList.remove('d-none');
    } else {
        suggestionsContainer.classList.add('d-none');
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadComponent('navbar.html', 'navbar-container');
    await loadComponent('footer.html', 'footer-container');

    // Show skeletons immediately
    renderProductSkeletons('product-grid', 6);
    renderProductSkeletons('product-carousel-inner', 3);

    emailjs.init('2x9OXBEHSO9gJUvwv');
    
    const checkoutModalElement = document.getElementById('checkoutModal');
    if (checkoutModalElement) {
        checkoutModal = new bootstrap.Modal(checkoutModalElement);
    }

    const sideCartElement = document.getElementById('sideCartDrawer');
    if (sideCartElement) {
        sideCart = new bootstrap.Offcanvas(sideCartElement);
    }
    
    loadCartFromLocalStorage();
    loadWishlistFromLocalStorage();

    products = await loadProducts();

    updateCartBadge();
    updateWishlistBadge();
    renderCartItems();
    renderFeaturedProducts();
    populateCategoryFilter(); // New: Fill the category dropdown
    filterAndRenderProducts();
    
    // Render wishlist page AFTER products are loaded
    if (window.location.pathname.includes('wishlist.html')) {
        renderWishlistPage();
    }

    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productName = e.target.dataset.productName;
            const productPrice = e.target.dataset.productPrice;
            addToCart(productName, productPrice);
            return;
        }

        const wishlistBtn = e.target.closest('.wishlist-btn');
        if (wishlistBtn) {
            const productName = wishlistBtn.dataset.productName;
            toggleWishlist(productName);
            return;
        }

        const sideCartTrigger = e.target.closest('#side-cart-trigger');
        if (sideCartTrigger) {
            e.preventDefault();
            if (sideCart) sideCart.show();
            return;
        }

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
            return;
        }

        if (e.target.id === 'checkout-btn' || e.target.id === 'side-cart-checkout-btn') {
            if (sideCart) sideCart.hide();
            if(checkoutModalElement) {
                // Update Order Summary in Modal
                const summaryName = document.getElementById('summaryProductName');
                const summaryPrice = document.getElementById('summaryProductPrice');
                
                if (summaryName && summaryPrice) {
                    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    const total = subtotal + SHIPPING_COST;
                    
                    if (cart.length === 1) {
                        summaryName.textContent = cart[0].name + (cart[0].quantity > 1 ? ` (x${cart[0].quantity})` : '');
                    } else {
                        summaryName.textContent = `${cart.length} Items in Cart`;
                    }
                    summaryPrice.textContent = `Total: ${CURRENCY} ${formatPrice(total)}`;
                }

                if (!checkoutModal) {
                    checkoutModal = new bootstrap.Modal(checkoutModalElement);
                }
                checkoutModal.show();
            }
        }

        const suggestionItem = e.target.closest('.suggestion-item');
        if (suggestionItem) {
            const productName = suggestionItem.dataset.productName;
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = productName;
                filterAndRenderProducts();
                const suggestionsContainer = document.getElementById('search-suggestions');
                if (suggestionsContainer) suggestionsContainer.classList.add('d-none');
            }
        }
    });


    const payNowBtn = document.getElementById('pay-now-btn');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm && checkoutForm.checkValidity()) {
                const name = document.getElementById('checkout_fullName').value;
                const email = document.getElementById('checkout_email').value;
                const phone = document.getElementById('phone').value;
                const address = document.getElementById('address').value;
                
                const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const total = subtotal + SHIPPING_COST;

                payWithPaystack(email, name, phone, address, total, cart, checkoutForm);
                
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
    const categorySelect = document.getElementById('filter-category'); // New
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterAndRenderProducts();
            handleSearchSuggestions(e);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            const suggestionsContainer = document.getElementById('search-suggestions');
            if (suggestionsContainer && !searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.add('d-none');
            }
        });
    }
    if(sortSelect) sortSelect.addEventListener('change', filterAndRenderProducts);
    if(categorySelect) categorySelect.addEventListener('change', filterAndRenderProducts); // New

});

function populateCategoryFilter() {
    const categorySelect = document.getElementById('filter-category');
    if (!categorySelect) return;

    // Extract unique categories from products
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    
    // Sort them alphabetically
    categories.sort();

    // Clear existing options except "All Categories"
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    
    // Add categories to dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function filterAndRenderProducts() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-products');
    const categorySelect = document.getElementById('filter-category'); // New
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const sortBy = sortSelect ? sortSelect.value : 'default';
    const selectedCategory = categorySelect ? categorySelect.value : 'all'; // New

    let filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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

function renderWishlistPage() {
    const wishlistGrid = document.getElementById('wishlist-grid');
    const wishlistEmpty = document.getElementById('wishlist-empty-message');
    
    if (!wishlistGrid) return;

    const wishlistedProducts = products.filter(p => wishlist.includes(p.name));

    if (wishlistedProducts.length === 0) {
        wishlistGrid.innerHTML = '';
        if (wishlistEmpty) wishlistEmpty.classList.remove('d-none');
    } else {
        if (wishlistEmpty) wishlistEmpty.classList.add('d-none');
        wishlistGrid.innerHTML = '';
        wishlistedProducts.forEach(product => {
            const categoryBadge = product.category ? `<span class="badge bg-secondary mb-2">${product.category}</span>` : '';
            const productCardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card product-card h-100">
                        <button class="wishlist-btn active" data-product-name="${product.name}" title="Remove from Wishlist">
                            <i class="bi bi-heart-fill"></i>
                        </button>
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body d-flex flex-column">
                            ${categoryBadge}
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text fw-bold mt-auto">${CURRENCY} ${formatPrice(product.price)}</p>
                            <button class="btn btn-primary add-to-cart-btn" data-product-name="${product.name}" data-product-price="${product.price}">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
            wishlistGrid.innerHTML += productCardHTML;
        });
    }
}

