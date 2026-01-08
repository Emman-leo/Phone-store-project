import { supabase } from './supabase-client.js';

const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const productList = document.getElementById('product-list');
const logoutBtn = document.getElementById('logout-btn');
const addProductBtn = document.getElementById('add-product-btn');
const productModalEl = document.getElementById('product-modal');
const productModal = new bootstrap.Modal(productModalEl);
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');

document.addEventListener('DOMContentLoaded', () => {
    checkUser();

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const { error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                loginError.textContent = error.message;
            } else {
                loginSection.classList.add('d-none');
                adminDashboard.classList.remove('d-none');
                loadProducts();
            }
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            location.reload();
        });
    }

    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            modalTitle.textContent = 'Add New Product';
            productForm.reset();
            document.getElementById('product-id').value = '';
            productModal.show();
        });
    }

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productId = document.getElementById('product-id').value;
        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            image: document.getElementById('product-image').value,
            featured: document.getElementById('product-featured').checked,
        };

        let error;
        if (productId) {
            // Update existing product
            ({ error } = await supabase.from('products').update(productData).match({ id: productId }));
        } else {
            // Add new product
            ({ error } = await supabase.from('products').insert([productData]));
        }

        if (error) {
            console.error('Error saving product:', error);
        } else {
            productModal.hide();
            loadProducts();
        }
    });

    productList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const productId = target.dataset.id;

        if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this product?')) {
                const { error } = await supabase.from('products').delete().match({ id: productId });
                if (error) {
                    console.error('Error deleting product:', error);
                } else {
                    loadProducts();
                }
            }
        } else if (target.classList.contains('edit-btn')) {
            const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();

            if (error) {
                console.error('Error fetching product for edit:', error);
                return;
            }

            modalTitle.textContent = 'Edit Product';
            document.getElementById('product-id').value = data.id;
            document.getElementById('product-name').value = data.name;
            document.getElementById('product-description').value = data.description;
            document.getElementById('product-price').value = data.price;
            document.getElementById('product-image').value = data.image;
            document.getElementById('product-featured').checked = data.featured;
            
            productModal.show();
        }
    });
});

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        loginSection.classList.add('d-none');
        adminDashboard.classList.remove('d-none');
        await loadProducts();
    } else {
        loginSection.classList.remove('d-none');
        adminDashboard.classList.add('d-none');
    }
}

async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) {
        console.error('Error loading products:', error);
        return;
    }
    productList.innerHTML = data.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.price}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-btn" data-id="${product.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${product.id}">Delete</button>
            </td>
        </tr>
    `).join('');
}
