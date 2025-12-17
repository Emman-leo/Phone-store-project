const products = [
    {
        name: "iPhone 15 Pro",
        price: "11999.00",
        image: "https://bestpricegh.com/cdn/shop/files/5-iphone-15-pro-max_6fdd8db4-1328-4bc2-9996-c0c31fddcb8f.jpg?crop=center&height=600&v=1695910525&width=600",
        description: "The ultimate iPhone, with the powerful A17 Pro chip, a customizable Action button, and the best iPhone camera system yet."
    },
    {
        name: "iPhone 15",
        price: "8999.00",
        image: "https://bestpricegh.com/cdn/shop/files/Frame5.png?crop=center&height=600&v=1706792874&width=600",
        description: "A total powerhouse. With the Dynamic Island, a 48MP Main camera, and USB-C. All in a durable color-infused glass and aluminum design."
    },
    {
        name: "MacBook Air 15”",
        price: "14999.00",
        image: "https://i.pcmag.com/imagery/reviews/03Zr1IMIMcjkF0kN3zxL5dv-2.jpg",
        description: "Impressively big. Impossibly thin. The 15-inch MacBook Air with the M2 chip is a super-portable laptop with a stunning Liquid Retina display."
    },
    {
        name: "iPad Pro",
        price: "11299.00",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQo_5dfcQRrTonSIfNxFzGkq1ZODmas6QMQ8Q&s",
        description: "The ultimate iPad experience, with the incredible power of the M4 chip, a breakthrough Ultra Retina XDR display, and superfast Wi-Fi 6E."
    },
    {
        name: "Apple Watch Ultra 2",
        price: "9499.00",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTOQfHW3hImIRvhk5ZRzaX74A9XC6Ol8z4-Q&s",
        description: "The most rugged and capable Apple Watch. Designed for outdoor adventures and supercharged workouts with a lightweight titanium case."
    },
    {
        name: "AirPods Pro (2nd Gen)",
        price: "2999.00",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=572&hei=572&fmt=jpeg&qlt=95&.v=1660803570327",
        description: "Richer audio quality, with up to 2x more Active Noise Cancellation, Adaptive Transparency, and Personalized Spatial Audio."
    },
    {
        name: "24-inch iMac",
        price: "14999.00",
        image: "https://www.slashgear.com/img/gallery/apple-imac-24-inch-review-the-right-mac-for-most-people/l-intro-1650914299.jpg",
        description: "A stunningly thin and vibrant all-in-one desktop computer, powered by the M3 chip. It's perfect for work and play."
    },
    {
        name: "Apple Vision Pro",
        price: "41999.00",
        image: "https://telefonika.com/cdn/shop/files/Apple-Vision-Pro.jpg?v=1758052832",
        description: "A revolutionary spatial computer that blends digital content with your physical space. Welcome to the era of spatial computing."
    },
    {
        name: "HomePod",
        price: "3499.00",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwWg9dP0r0Pr_co3FWhf34XYhRggVcvkpLFw&s",
        description: "A powerhouse of a speaker that delivers high-fidelity audio and room-filling sound. It's also a smart home hub."
    }
];

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
        const featuredProducts = products.slice(0, 3);
        featuredProducts.forEach((product, index) => {
            const activeClass = index === 0 ? "active" : "";
            const carouselItem = `
                <div class="carousel-item ${activeClass}">
                    <div class="row justify-content-center">
                        <div class="col-md-8">
                             <div class="card product-card">
                                <img src="${product.image}" class="card-img-top" alt="${product.name}">
                                <div class="card-body">
                                    <h5 class="card-title">${product.name}</h5>
                                    <p class="card-text">${product.description}</p>
                                    <p class="card-text fw-bold">GHS ${formatPrice(product.price)}</p>
                                    <a href="products.html" class="btn btn-primary">View Product</a>
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

function payWithPaystack(email, amount, form) {
    const handler = PaystackPop.setup({
        key: 'YOUR_PAYSTACK_PUBLIC_KEY', // Replace with your public key
        email: email,
        amount: parseFloat(amount) * 100, // amount is in pesewas
        currency: 'GHS',
        ref: '' + Math.floor((Math.random() * 1000000000) + 1),
        callback: function(response) {
            const formAction = 'https://formspree.io/f/mblnnppl';
            const formData = new FormData(form);

            fetch(formAction, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    alert('Payment successful and order submitted!');
                    const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
                    checkoutModal.hide();
                    form.reset();
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            alert(data["errors"].map(error => error["message"]).join(", "));
                        } else {
                            alert('Oops! There was a problem submitting your order.');
                        }
                    })
                }
            }).catch(error => {
                alert('Oops! There was a problem submitting your order.');
                console.error(error);
            });
        },
        onClose: function() {
            alert('Window closed.');
        }
    });
    handler.openIframe();
}

document.addEventListener("DOMContentLoaded", () => {
    renderFeaturedProducts();

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

    const payNowBtn = document.getElementById('pay-now-btn');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const checkoutForm = document.getElementById('checkout-form');
            if (checkoutForm.checkValidity()) {
                const email = document.getElementById('email').value;
                const price = document.getElementById('product-price-input').value;
                payWithPaystack(email, price, checkoutForm);
            } else {
                checkoutForm.reportValidity();
            }
        });
    }
});