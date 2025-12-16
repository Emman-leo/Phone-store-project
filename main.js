
document.addEventListener('DOMContentLoaded', () => {
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            if (document.getElementById('product-grid')) {
                populateProductGrid(products);
            }
            if (document.getElementById('product-carousel-inner')) {
                populateCarousel(products);
            }
        });
});

function populateProductGrid(products) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';
    products.forEach(product => {
        const productCard = `
            <div class="col-md-4">
                <div class="card product-card shadow-sm h-100">
                    <img src="${product.image}"
                         class="card-img-top" alt="${product.name}">
                    <div class="card-body text-center">
                        <h5 class="card-title fw-semibold">${product.name}</h5>
                        <p class="text-muted small">
                            ${product.description}
                        </p>
                        <p class="price">${product.price}</p>
                        <button class="btn btn-primary w-100" data-bs-toggle="modal" data-bs-target="#checkoutModal">Buy Now</button>
                    </div>
                </div>
            </div>
        `;
        productGrid.innerHTML += productCard;
    });
}

function populateCarousel(products) {
    const carouselInner = document.getElementById('product-carousel-inner');
    carouselInner.innerHTML = '';
    products.slice(0, 3).forEach((product, index) => {
        const carouselItem = `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <div class="carousel-product">
                    <img src="${product.image}"
                         alt="${product.name}">

                    <h5 class="mt-3">${product.name}</h5>
                    <p class="price">${product.price}</p>
                    <a href="products.html" class="btn btn-primary btn-sm">Buy Now</a>
                </div>
            </div>
        `;
        carouselInner.innerHTML += carouselItem;
    });
}
