
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

let cart = [];

function formatPrice(price) {
    const number = parseFloat(price);
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function addToCart(productName) {
    const product = products.find(p => p.name === productName);
    if (product) {
        cart.push(product);
        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`${product.name} has been added to your cart.`);
    }
}

function renderProducts() {
    const productGrid = document.getElementById("product-grid");
    if (productGrid) {
        productGrid.innerHTML = ''; // Clear existing products
        products.forEach(product => {
            const productCard = `
                <div class="col-md-4 mb-4">
                    <div class="card product-card h-100">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text fw-bold mt-auto">GHS ${formatPrice(product.price)}</p>
                            <button class="btn btn-primary" onclick="addToCart('''${product.name}''')">Add to Cart</button>
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

function loadCart() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    renderProducts();
    renderFeaturedProducts();
});
