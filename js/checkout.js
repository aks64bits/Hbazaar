document.addEventListener('DOMContentLoaded', () => {
    console.log('Checkout Module Loaded');

    // Dependencies
    const products = DB.getProducts();
    let cart = JSON.parse(localStorage.getItem('hbazaar_cart') || '[]');
    const currentUser = DB.getCurrentUser();

    // DOM Elements
    const summaryItems = document.getElementById('summaryItems');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryTax = document.getElementById('summaryTax');
    const summaryTotal = document.getElementById('summaryTotal');
    const checkoutForm = document.getElementById('checkoutForm');

    // Redirect if empty
    if (cart.length === 0) {
        window.location.href = 'shop.html';
        return;
    }

    // --- Logic ---

    // 1. Calculate Totals
    const calculateTotals = () => {
        let subtotal = 0;
        cart.forEach(item => {
            const product = products.find(p => String(p.id) === String(item.id));
            if (product) {
                const price = Number(product.price) || 0;
                const qty = Number(item.quantity) || 0;
                subtotal += price * qty;
            }
        });
        const tax = subtotal * 0.10;
        return { subtotal, tax, total: subtotal + tax };
    };

    // 2. Render Summary
    const renderSummary = () => {
        if (!summaryItems) return;
        summaryItems.innerHTML = '';

        cart.forEach(item => {
            const product = products.find(p => String(p.id) === String(item.id));
            if (product) {
                const price = Number(product.price);
                const qty = Number(item.quantity);
                const itemTotal = price * qty;

                const div = document.createElement('div');
                div.className = 'summary-item';
                div.innerHTML = `
                   <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${product.image}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
                        <div>
                            <div style="font-weight:600; color:white;">${product.title}</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary);">Qty: ${qty}</div>
                        </div>
                   </div>
                   <div style="font-weight:600; color:var(--accent-secondary);">₹${itemTotal.toFixed(2)}</div>
                `;
                summaryItems.appendChild(div);
            }
        });

        const totals = calculateTotals();
        if (summarySubtotal) summarySubtotal.textContent = `₹${totals.subtotal.toFixed(2)}`;
        if (summaryTax) summaryTax.textContent = `₹${totals.tax.toFixed(2)}`;
        if (summaryTotal) summaryTotal.textContent = `₹${totals.total.toFixed(2)}`;
    };

    // 3. Pre-fill Form
    const prefillForm = () => {
        if (!currentUser) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val) el.value = val;
        };

        if (currentUser.name) {
            const names = currentUser.name.split(' ');
            setVal('chkFirstName', names[0]);
            setVal('chkLastName', names.slice(1).join(' '));
        }
        setVal('chkEmail', currentUser.email);

        if (currentUser.addresses && currentUser.addresses.length > 0) {
            const addr = currentUser.addresses[0];
            setVal('chkAddress', addr.street);
            setVal('chkCity', addr.city);
            setVal('chkZip', addr.zip);
        }
    };

    // 4. Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        const btn = checkoutForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

        // Simulate Network Delay
        await new Promise(r => setTimeout(r, 1500));

        try {
            const totals = calculateTotals();

            // Extract Values safely
            const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

            const orderData = {
                items: [...cart],
                total: totals.total,
                paymentMethod: 'Cash on Delivery',
                shippingDetails: {
                    firstName: getVal('chkFirstName'),
                    lastName: getVal('chkLastName'),
                    email: getVal('chkEmail'),
                    address: getVal('chkAddress'),
                    city: getVal('chkCity'),
                    zip: getVal('chkZip')
                }
            };

            // Save Order
            const newOrder = DB.createOrder(orderData);
            console.log('Order Created:', newOrder);

            // Clear Cart
            localStorage.setItem('hbazaar_cart', '[]');

            // Redirect
            window.location.href = 'order-success.html';

        } catch (error) {
            console.error('Checkout Error:', error);
            alert('Something went wrong. Please try again.');
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    // Init
    renderSummary();
    prefillForm();
    if (checkoutForm) checkoutForm.addEventListener('submit', handleSubmit);

});
