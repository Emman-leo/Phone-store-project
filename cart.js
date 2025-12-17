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
    const productNameInput = document.getElementById('product-name-input');
    const productPriceInput = document.getElementById('product-price-input');
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
        cartTotalContainer.innerText = 'GHS 0.00';
        productNameInput.value = '';
        productPriceInput.value = '';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let productNames = [];
    cart.forEach(product => {
        total += parseFloat(product.price);
        productNames.push(product.name);
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
    productNameInput.value = productNames.join(', ');
    productPriceInput.value = total.toFixed(2);
}

function removeFromCart(productName) {
    const productIndex = cart.findIndex(p => p.name === productName);
    if (productIndex > -1) {
        cart.splice(productIndex, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
}

function payWithPaystack(email, amount, form) {
    const handler = PaystackPop.setup({
        key: 'YOUR_PAYSTACK_PUBLIC_KEY', // Replace with your public key
        email: email,
        amount: parseFloat(amount) * 100, // amount is in pesewas
        currency: 'GHS',
        ref: ''+Math.floor((Math.random() * 1000000000) + 1),
        callback: function(response){
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
                    cart = []; // Clear the cart
                    localStorage.removeItem('cart'); // Clear cart from storage
                    renderCart(); // Re-render the cart
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

function loadCart() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();

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

