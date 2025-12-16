
const products = [
    {
        name: "iPhone 15 Pro",
        price: "1399",
        image: "https://www.zdnet.com/a/img/resize/66450c225221ba0724d704497f16e822a1c7b259/2024/01/30/aa011be9-f047-4cd5-87b5-741ba6531aa2/dsc01154.jpg?auto=webp&fit=crop&height=360&width=640",
        description: "The latest iPhone with a powerful A17 Bionic chip and a stunning Pro-Motion XDR display."
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        price: "1299",
        image: "https://www.livemint.com/lm-img/img/2023/08/03/600x338/iphone_14_pro_max_1691039383219_1691039389911.jpg",
        description: "The ultimate Android phone with a versatile camera system and a built-in S Pen."
    },
    {
        name: "Google Pixel 8 Pro",
        price: "999",
        image: "https://static.vecteezy.com/system/resources/previews/042/665/350/non_2x/fast-delivery-logo-with-courier-vector.jpg",
        description: "The smartest smartphone with a brilliant camera and the best of Google's AI."
    }
];

function renderProducts() {
    const productGrid = document.getElementById("product-grid");
    if (productGrid) {
        products.forEach(product => {
            const productCard = `
                <div class="col-md-4">
                    <div class="card product-card">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text fw-bold">$${product.price}</p>
                            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#checkoutModal" data-product-name="${product.name}" data-product-price="${product.price}">Buy Now</button>
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
        products.forEach((product, index) => {
            const activeClass = index === 0 ? "active" : "";
            const carouselItem = `
                <div class="carousel-item ${activeClass}">
                    <div class="card product-card">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text fw-bold">$${product.price}</p>
                            <a href="products.html" class="btn btn-primary">View Product</a>
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
        amount: amount * 100, // amount is in kobo
        currency: 'GHS', // or your preferred currency
        ref: ''+Math.floor((Math.random() * 1000000000) + 1), // generates a pseudo-unique reference. Please replace with a unique reference endpoint
        callback: function(response){
            // After successful payment, submit the form
            const formAction = 'https://formspree.io/f/mqarvqwr';
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
        onClose: function(){
            alert('Window closed.');
        }
    });
    handler.openIframe();
}

document.addEventListener("DOMContentLoaded", () => {
    renderProducts();
    renderFeaturedProducts();

    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        checkoutModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const productName = button.getAttribute('data-product-name');
            const productPrice = button.getAttribute('data-product-price');
            const modalTitle = checkoutModal.querySelector('.modal-title');
            const productNameInput = document.getElementById('product-name-input');
            const productPriceInput = document.getElementById('product-price-input');
            
            modalTitle.textContent = 'Checkout: ' + productName;
            productNameInput.value = productName;
            productPriceInput.value = productPrice;
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
