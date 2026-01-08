import { supabase } from './supabase-client.js';

const CURRENCY = 'GHS';

// DOM elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const productList = document.getElementById('product-list');
const addProductBtn = document.getElementById('add-product-btn');
const productModal = new bootstrap.Modal(document.getElementById('product-modal'));
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productImageUploadInput = document.getElementById('product-image-upload');
const productImageUrlInput = document.getElementById('product-image-url');
const productFeaturedInput = document.getElementById('product-featured');

function formatPrice(price) {
    const number = parseFloat(price);
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        loginSection.classList.add('d-none');
        adminDashboard.classList.remove('d-none');
        fetchProducts();
    } else {
        loginSection.classList.remove('d-none');
        adminDashboard.classList.add('d-none');
    }
};

const fetchProducts = async () => {
    const { data: products, error } = await supabase.from('products').select('*').order('name');
    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    productList.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${CURRENCY} ${formatPrice(product.price)}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-btn" data-id="${product.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${product.id}">Delete</button>
            </td>
        </tr>
    `).join('');
};

const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginError.textContent = error.message;
    } else {
        loginError.textContent = '';
        checkUser();
    }
};

const handleLogout = async () => {
    await supabase.auth.signOut();
    checkUser();
};

const openProductModal = (product = null) => {
    productForm.reset();
    if (product) {
        modalTitle.textContent = 'Edit Product';
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productDescriptionInput.value = product.description;
        productPriceInput.value = product.price;
        productImageUrlInput.value = product.image;
        productFeaturedInput.checked = product.featured;
    } else {
        modalTitle.textContent = 'Add Product';
    }
    productModal.show();
};

const saveProduct = async (e) => {
    e.preventDefault();

    let imageUrl = productImageUrlInput.value.trim();
    const file = productImageUploadInput.files[0];

    if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            alert('Error uploading image. Please try again.');
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
    }

    const productData = {
        name: productNameInput.value,
        description: productDescriptionInput.value,
        price: parseFloat(productPriceInput.value),
        image: imageUrl,
        featured: productFeaturedInput.checked,
    };

    const id = productIdInput.value;
    let result;
    if (id) {
        result = await supabase.from('products').update(productData).eq('id', id);
    } else {
        result = await supabase.from('products').insert(productData);
    }

    if (result.error) {
        console.error('Error saving product:', result.error);
        alert('Error saving product. Check the console for details.');
    } else {
        productModal.hide();
        fetchProducts();
    }
};

const deleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product.');
    } else {
        fetchProducts();
    }
};

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
addProductBtn.addEventListener('click', () => openProductModal());

productList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const productId = e.target.dataset.id;
        const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
        if (error) {
            console.error('Error fetching product for edit:', error);
        } else {
            openProductModal(product);
        }
    }

    if (e.target.classList.contains('delete-btn')) {
        const productId = e.target.dataset.id;
        deleteProduct(productId);
    }
});

productForm.addEventListener('submit', saveProduct);

document.addEventListener('DOMContentLoaded', checkUser);
