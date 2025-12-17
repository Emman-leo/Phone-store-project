
let cart = [];

function formatPrice(price) {
    const number = parseFloat(price);
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
        cartTotalContainer.innerText = 'GHS 0.00';
        return;
    }

    cartItemsContainer.innerHTML = '';
    cart.forEach(product => {
        total += parseFloat(product.price);
        const cartItem = `
            <tr>
                <td>${product.name}</td>
                <td>GHS ${formatPrice(product.price)}</td>
                <td>1</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removeFromCart('''${product.name}''')">Remove</button>
                </td>
            </tr>
        `;
        cartItemsContainer.innerHTML += cartItem;
    });

    cartTotalContainer.innerText = `GHS ${formatPrice(total)}`;
}

function removeFromCart(productName) {
    const productIndex = cart.findIndex(p => p.name === productName);
    if (productIndex > -1) {
        cart.splice(productIndex, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
}

function loadCart() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();
});
