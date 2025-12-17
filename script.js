const products = [
    {
        name: "iPhone 15 Pro",
        price: "20985.00",
        image: "https://www.zdnet.com/a/img/resize/66450c225221ba0724d704497f16e822a1c7b259/2024/01/30/aa011be9-f047-4cd5-87b5-741ba6531aa2/dsc01154.jpg?auto=webp&fit=crop&height=360&width=640",
        description: "The latest iPhone with a powerful A17 Bionic chip and a stunning Pro-Motion XDR display."
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        price: "19485.00",
        image: "https://www.livemint.com/lm-img/img/2023/08/03/600x338/iphone_14_pro_max_1691039383219_1691039389911.jpg",
        description: "The ultimate Android phone with a versatile camera system and a built-in S Pen."
    },
    {
        name: "Google Pixel 8 Pro",
        price: "14985.00",
        image: "https://static.vecteezy.com/system/resources/previews/042/665/350/non_2x/fast-delivery-logo-with-courier-vector.jpg",
        description: "The smartest smartphone with a brilliant camera and the best of Google's AI."
    },
    {
        name: "Sony Xperia 1 V",
        price: "20235.00",
        image: "https://i.blogs.es/e55115/sony-xperia-1-v-oficial-/1366_2000.jpeg",
        description: "Pro-level camera co-developed with ZEISS, and a stunning 4K HDR OLED display."
    },
    {
        name: "OnePlus 12",
        price: "11985.00",
        image: "https://www.notebookcheck.net/fileadmin/Notebooks/News/_nc3/OnePlus_12_camera_Hasselblad.jpg",
        description: "Blazing-fast performance with the latest Snapdragon processor and ultra-fast charging."
    },
    {
        name: "Xiaomi 14 Ultra",
        price: "19485.00",
        image: "https://fdn.gsmarena.com/imgroot/news/24/02/xiaomi-14-ultra-ofic/inline/-1200/gsmarena_004.jpg",
        description: "A camera powerhouse with a Leica-engineered quad-camera system for stunning photos."
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
    if (productGrid) {
        productGrid.innerHTML = ''; // Clear existing products
        productsToRender.forEach(product => {
            const productCard = `
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
            productGrid.innerHTML += productCard;
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

    // Logic for the main products page
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        // Initial render
        renderProducts(products);

        // Sorting functionality
        const sortSelect = document.getElementById('sort-products');
        sortSelect.addEventListener('change', () => {
            const sortBy = sortSelect.value;
            let productsToRender = [...products]; // Create a fresh copy to sort

            if (sortBy === 'price-asc') {
                productsToRender.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            } else if (sortBy === 'price-desc') {
                productsToRender.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            } else if (sortBy === 'name-asc') {
                productsToRender.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortBy === 'name-desc') {
                productsToRender.sort((a, b) => b.name.localeCompare(a.name));
            }
            // If 'default', we use the fresh unsorted copy

            renderProducts(productsToRender);
        });
        
        // Event listener for "Buy Now" buttons on the products page
        productGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-now-btn')) {
                const productName = e.target.dataset.productName;
                const productPrice = e.target.dataset.productPrice;
                openCheckoutModal(productName, productPrice);
            }
        });
    }

    // Event listener for the "Pay Now" button in the checkout modal
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