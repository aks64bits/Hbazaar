document.addEventListener('DOMContentLoaded', () => {
    // Product Data
    // Product Data
    const products = DB.getProducts();

    // Toast Notification System
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} slide-up`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Styles
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = type === 'success' ? 'rgba(0, 200, 83, 0.9)' : 'rgba(255, 64, 129, 0.9)';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '12px';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.zIndex = '1000';
        toast.style.backdropFilter = 'blur(10px)';
        toast.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
        toast.style.minWidth = '250px';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    };

    // State
    // State - Fetch from DB
    // Note: In a real app we wouldn't fetch ALL users/orders to client, but this is a simulation.
    // Cart Migration (Lumina -> HBazaar)
    let cart = JSON.parse(localStorage.getItem('hbazaar_cart'));
    if (!cart) {
        const legacyCart = localStorage.getItem('lumina_cart');
        if (legacyCart) {
            cart = JSON.parse(legacyCart);
            localStorage.setItem('hbazaar_cart', legacyCart);
            // localStorage.removeItem('lumina_cart'); // Keep for safety for now
        } else {
            cart = [];
        }
    }
    let currentUser = DB.getCurrentUser();
    let orders = currentUser ? DB.getOrders(currentUser.id) : []; // Load user-specific orders

    // Auth UI Updates
    const mobileNavHeader = document.querySelector('.mobile-links');
    const desktopNav = document.querySelector('.desktop-nav');

    if (currentUser) {
        // Add Profile Button to Desktop
        const profileBtn = document.createElement('a');
        profileBtn.href = 'profile.html';
        profileBtn.className = 'nav-link';
        profileBtn.innerHTML = '<i class="fa-solid fa-user-circle"></i> Profile';
        desktopNav.insertBefore(profileBtn, document.getElementById('cartBtn'));

        // Mobile
        const mProfile = document.createElement('a');
        mProfile.href = 'profile.html';
        mProfile.className = 'mobile-link';
        mProfile.innerHTML = '<i class="fa-solid fa-user-circle"></i> Profile';
        mobileNavHeader.appendChild(mProfile);
    } else {
        // Add Login Button
        const loginBtn = document.createElement('a');
        loginBtn.href = 'login.html';
        loginBtn.className = 'nav-link';
        loginBtn.innerHTML = 'Login';
        desktopNav.insertBefore(loginBtn, document.getElementById('cartBtn'));

        const mLogin = document.createElement('a');
        mLogin.href = 'login.html';
        mLogin.className = 'mobile-link';
        mLogin.innerHTML = '<i class="fa-solid fa-user"></i> Login';
        mobileNavHeader.appendChild(mLogin);
    }

    // DOM Elements - Shared
    const cartBtns = document.querySelectorAll('.cart-btn'); // Now multiple (desktop + mobile) if needed, or just one
    const cartBadge = document.getElementById('cartBadge');
    const cartModal = document.getElementById('cartModal');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.querySelector('#cartTotal'); // Logic might need adjustment if multiple totals
    const checkoutBtn = document.getElementById('checkoutBtn');

    // --- Footer Component ---
    const renderFooter = () => {
        const existingFooter = document.querySelector('footer');
        if (existingFooter) existingFooter.remove(); // Clean up if manual exists

        const footer = document.createElement('footer');
        footer.id = "mainFooter";
        footer.style.textAlign = "center";
        footer.style.padding = "2rem";
        footer.style.color = "var(--text-secondary)";
        footer.style.fontSize = "0.9rem";
        footer.style.borderTop = "1px solid var(--glass-border)";
        footer.style.marginTop = "auto";
        footer.className = "glass-footer";

        footer.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <a href="index.html" style="color:white; text-decoration:none; font-weight:700; font-size:1.2rem; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:1rem;">
                    <i class="fa-solid fa-shapes"></i> HBazaar
                </a>
                <div style="display:flex; gap:15px; justify-content:center; font-size:1.2rem; margin-bottom:1rem;">
                    <a href="https://www.instagram.com/hbazaar.in/" style="color:white; opacity:0.7; transition:0.3s;"><i class="fa-brands fa-instagram"></i></a>
                    <a href="https://wa.me/918051648462" style="color:white; opacity:0.7; transition:0.3s;"><i class="fa-brands fa-whatsapp"></i></a>
                    <a href="https://www.facebook.com/hbazaar.in/" style="color:white; opacity:0.7; transition:0.3s;"><i class="fa-brands fa-facebook"></i></a>
                </div>
            </div>
            <p>&copy; 2026 HBazaar. Managed by Akash Singh.</p>
            <div style="margin-top: 1rem; font-size:0.9rem; display:flex; gap:15px; justify-content:center;">
                <a href="about.html" style="color:var(--text-secondary); text-decoration:none;">About</a>
                <a href="privacy.html" style="color:var(--text-secondary); text-decoration:none;">Privacy</a>
                <a href="terms.html" style="color:var(--text-secondary); text-decoration:none;">Terms</a>
            </div>
        `;

        // Inject into app-container if exists, else body
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
            appContainer.appendChild(footer);
        } else {
            document.body.appendChild(footer);
        }
    };
    renderFooter();

    // DOM Elements - Shop/Home
    const featuredGrid = document.getElementById('featuredGrid');
    const productsGrid = document.getElementById('productsGrid');

    // DOM Elements - Checkout
    const summaryItems = document.getElementById('summaryItems');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTax = document.getElementById('summaryTax');
    const summaryTotal = document.getElementById('summaryTotal');
    const checkoutForm = document.getElementById('checkoutForm');

    // DOM Elements - Orders
    const ordersContainer = document.getElementById('ordersContainer');

    // Functions
    const saveCart = () => {
        localStorage.setItem('hbazaar_cart', JSON.stringify(cart));
        updateCartUI();
    };

    const saveOrders = () => {
        // orders are saved via DB class immediately in this flow, but if we modify array directly:
        // localStorage.setItem('hbazaar_orders', JSON.stringify(orders)); // Deprecated
    };

    const updateCartUI = () => {
        // Update Badge
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            if (totalItems > 0) {
                cartBadge.classList.remove('hidden');
                cartBadge.style.display = 'flex';
            } else {
                cartBadge.classList.add('hidden');
                cartBadge.style.display = 'none';
            }
        }

        // Update Modal Items
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            let total = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<div style="text-align: center; margin-top: 2rem; color: var(--text-secondary);">Your cart is empty</div>';
            } else {
                cart.forEach(item => {
                    const product = products.find(p => p.id == item.id);
                    if (product) {
                        const itemTotal = product.price * item.quantity;
                        total += itemTotal;

                        const el = document.createElement('div');
                        el.className = 'cart-item slide-up';
                        el.innerHTML = `
                            <img src="${product.image}" alt="${product.title}">
                            <div class="cart-item-details" style="flex-grow:1">
                                <div class="cart-item-title" style="color:white; font-weight:600">${product.title}</div>
                                <div class="cart-item-price" style="color:var(--accent-secondary)">₹${product.price} x ${item.quantity}</div>
                            </div>
                            <button class="remove-btn" style="background:rgba(255,64,129,0.1); color:#ff4081; border:none; width:30px; height:30px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                        `;
                        el.querySelector('.remove-btn').addEventListener('click', () => removeFromCart(item.id));
                        cartItemsContainer.appendChild(el);
                    }
                });
            }
            if (cartTotalEl) cartTotalEl.textContent = `₹${total.toFixed(2)}`;
        }
    };

    const addToCart = (id) => {
        const existing = cart.find(item => item.id == id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ id, quantity: 1 });
        }
        saveCart();

        if (cartModal) cartModal.classList.add('open');
    };

    const removeFromCart = (id) => {
        cart = cart.filter(item => item.id != id);
        saveCart();
        if (summaryItems) renderCheckoutSummary();
    };

    const renderProduct = (product) => {
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="product-image">
            <div class="product-info">
                <div class="product-title">${product.title}</div>
                <div class="product-price">₹${product.price}</div>
                <button class="add-to-cart-btn" data-id="${product.id}">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `;

        card.querySelector('.add-to-cart-btn').addEventListener('click', () => addToCart(product.id));
        return card;
    };

    const renderGrid = (target, items) => {
        if (!target) return;
        target.innerHTML = '';
        items.forEach(product => {
            target.appendChild(renderProduct(product));
        });
    };

    const calculateCartTotal = () => {
        let subtotal = 0;
        if (!products || products.length === 0) {
            console.warn('Products not loaded or empty');
            return { subtotal: 0, tax: 0, total: 0 };
        }

        console.log('Calculating Total for Cart:', cart);

        cart.forEach(item => {
            // Robust ID matching
            const product = products.find(p => String(p.id) === String(item.id));
            if (product) {
                const price = Number(product.price) || 0;
                const qty = Number(item.quantity) || 0;
                subtotal += price * qty;
            } else {
                console.warn(`Product not found for ID: ${item.id}`);
            }
        });

        const tax = subtotal * 0.10;
        console.log('Calculation Result:', { subtotal, tax, total: subtotal + tax });
        return { subtotal, tax, total: subtotal + tax };
    };

    // renderCheckoutSummary Removed


    const renderOrders = () => {
        if (!ordersContainer) return;
        ordersContainer.innerHTML = '';

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div style="text-align:center; padding: 4rem;">
                    <i class="fa-solid fa-box-open" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 1rem;">No orders yet</h3>
                    <a href="shop.html" class="premium-btn" style="display:inline-flex; width:auto; text-decoration:none;">Start Shopping</a>
                </div>
            `;
            return;
        }

        const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedOrders.forEach(order => {
            const date = new Date(order.date).toLocaleDateString();
            const card = document.createElement('div');
            card.className = 'order-card fade-in';

            order.items.forEach(item => {
                const product = products.find(p => p.id == item.id); // Loose equality
                if (product) {
                    imagesHtml += `<img src="${product.image}" alt="${product.title}" title="${product.title}">`;
                }
            });

            card.innerHTML = `
                <div class="order-header">
                    <div>
                        <div class="order-id">#${order.id}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <div class="order-status" style="color:${order.status === 'Cancelled' ? 'red' : 'var(--accent-secondary)'}">${order.status}</div>
                </div>
                <div class="order-items-preview">
                    ${imagesHtml}
                </div>
                <div class="order-footer">
                    <div>${order.items.reduce((acc, i) => acc + i.quantity, 0)} Items</div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div class="order-total">₹${order.total.toFixed(2)}</div>
                        ${(order.status === 'Pending' || order.status === 'Placed') ? `<button class="premium-btn edit-order-btn" data-id="${order.id}" style="padding:5px 15px; font-size:0.8rem; height:auto;">Edit/Cancel</button>` : ''}
                    </div>
                </div>
            `;

            const editBtn = card.querySelector('.edit-order-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => openEditOrderModal(order));
            }

            ordersContainer.appendChild(card);
        });
    };



    // Initialization
    updateCartUI();

    if (featuredGrid || productsGrid) {
        setTimeout(() => { // Simulate loading
            if (featuredGrid) renderGrid(featuredGrid, products.slice(0, 4));
            if (productsGrid) renderGrid(productsGrid, products);
        }, 300);
    }

    if (summaryItems) {
        if (cart.length === 0) window.location.href = 'shop.html';
        else renderCheckoutSummary(false); // Render with false for NO COD fee
    }

    // Render Orders Removed


    // Event Listeners
    // Handle multiple cart buttons (e.g. one in header, one in mobile menu if exists)
    cartBtns.forEach(btn => {
        btn.addEventListener('click', () => { if (cartModal) cartModal.classList.add('open'); });
    });

    // Legacy support for single ID if I forget to change HTML
    const singleCartBtn = document.getElementById('cartBtn');
    if (singleCartBtn) singleCartBtn.addEventListener('click', () => { if (cartModal) cartModal.classList.add('open'); });


    if (closeCartBtn) closeCartBtn.addEventListener('click', () => { cartModal.classList.remove('open'); });
    if (cartModal) cartModal.addEventListener('click', (e) => { if (e.target === cartModal) cartModal.classList.remove('open'); });

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) { showToast('Your cart is empty!', 'error'); return; }

            if (!currentUser) {
                showToast('Please Login to Checkout', 'error');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }

            window.location.href = 'checkout.html';
        });
    }

    // Mobile Menu Logic (NEW)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (mobileMenuBtn && mobileNavOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNavOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeMenuBtn && mobileNavOverlay) {
        closeMenuBtn.addEventListener('click', () => {
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                mobileNavOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileNavOverlay) {
                mobileNavOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Payment Method Logic
    // Only COD is available now
    const codFeeElement = document.getElementById('codFeeElement');
    let selectedPaymentMethod = 'cod';

    // Ensure fee is shown by default since it's the only option
    if (codFeeElement) codFeeElement.style.display = 'block';
    // Logic to render summary with fee is called later or we trigger it now
    // Actually renderCheckoutSummary calls calculateCartTotal which doesn't add fee, 
    // renderCheckoutSummary(isCod) adds specific UI row. 
    // We should ensure renderCheckoutSummary is called with true by default or updated to always show it.

    // Let's just hardcode the display logic since it's static now
    // But we need to make sure renderCheckoutSummary(true) is called.

    // We can leave the listener if we want, but simplifiying is better.
    // Removed listeners as there are no other options.

    // Address Logic
    // const savedAddressSelect = document.getElementById('savedAddressSelect'); // Removed
    const chkAddressInput = document.getElementById('chkAddress');
    const chkCity = checkoutForm ? checkoutForm.querySelector('input[placeholder="Mumbai"]') : null; // Need to be careful with selectors

    // Better Selectors for Checkout Form to avoid 'null' issues if I change placeholders
    // I should probably update checkout.html to have IDs for all inputs for safety, but for now relying on structure/placeholders if they exist
    // Actually, I'll assume they are standard inputs.

    if (checkoutForm && currentUser) {
        // Pre-fill Name/Email
        const nameInput = checkoutForm.querySelector('input[placeholder="John"]');
        const lastNameInput = checkoutForm.querySelector('input[placeholder="Doe"]');
        const emailInput = checkoutForm.querySelector('input[placeholder="john@example.com"]');

        if (currentUser.name) {
            const names = currentUser.name.split(' ');
            if (nameInput) nameInput.value = names[0];
            if (lastNameInput) lastNameInput.value = names.slice(1).join(' ');
        }
        if (currentUser.email && emailInput) emailInput.value = currentUser.email;

        if (currentUser.email && emailInput) emailInput.value = currentUser.email;

        // Auto-fill Address from Saved Addresses (No Dropdown)
        if (currentUser.addresses && currentUser.addresses.length > 0) {
            // Use the first address as default
            const addr = currentUser.addresses[0];

            if (chkAddressInput) chkAddressInput.value = addr.street || '';

            const cityInput = checkoutForm.querySelector('input[placeholder="Mumbai"]') ||
                document.getElementById('chkCity');

            const zipInput = checkoutForm.querySelector('input[placeholder="400001"]') ||
                document.getElementById('chkZip');

            if (cityInput) cityInput.value = addr.city || '';
            if (zipInput) zipInput.value = addr.zip || '';
        }
    }



    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (!currentUser) {
                alert('Please Login to place an order.');
                window.location.href = 'login.html';
                return;
            }

            const btn = checkoutForm.querySelector('button[type="submit"]');

            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:5px;"></div> Processing...';

            const totals = calculateCartTotal();
            let finalTotal = totals.total;



            // Capture Values HERE to avoid scope issues
            const fname = document.getElementById('chkFirstName');
            const lname = document.getElementById('chkLastName');
            const email = document.getElementById('chkEmail');
            const address = document.getElementById('chkAddress');
            const city = document.getElementById('chkCity');
            const zip = document.getElementById('chkZip');

            const orderName = (fname ? fname.value : 'Guest') + ' ' + (lname ? lname.value : '');
            const orderEmail = email ? email.value : 'no-email';
            const orderAddress = (address ? address.value : '') + ', ' + (city ? city.value : '') + ', ' + (zip ? zip.value : '');

            // COD Flow
            setTimeout(() => {
                const orderData = {
                    items: [...cart],
                    total: finalTotal,
                    paymentMethod: 'Cash on Delivery',
                    shippingDetails: {
                        name: orderName,
                        email: orderEmail,
                        address: orderAddress
                    }
                };

                DB.createOrder(orderData);

                cart = [];
                saveCart();
                window.location.href = 'order-success.html';
            }, 1500);
        });
    }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Registration Failed:', err));
    });
}


