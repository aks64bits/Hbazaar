document.addEventListener('DOMContentLoaded', () => {
    console.log('Advanced Orders Module Loaded');

    const ordersContainer = document.getElementById('ordersContainer');
    const currentUser = DB.getCurrentUser();
    const products = DB.getProducts();

    // 1. Strict Auth Check
    if (!currentUser) {
        // Show a quick toast or simple alert then redirect to minimize flicker
        // Or directly redirect
        console.warn('No user found, redirecting to login.');
        sessionStorage.setItem('redirect_after_login', 'orders.html');
        window.location.replace('login.html'); // replace prevents back button loop
        return; // Stop execution
    }

    // 2. Render Status Tracker
    const renderTracker = (status) => {
        // Steps: Placed -> Shipped -> Delivered
        // Mappings
        const steps = ['Placed', 'Shipped', 'Delivered'];
        let activeIndex = 0;

        if (status === 'Cancelled') return ''; // No tracker for cancelled

        if (status === 'Shipped') activeIndex = 1;
        if (status === 'Delivered') activeIndex = 2;
        if (status === 'Pending') activeIndex = 0; // Treat Pending as Placed/Processing

        return `
            <div class="status-tracker">
                <div class="tracker-line"></div>
                ${steps.map((step, idx) => `
                    <div class="tracker-step ${idx <= activeIndex ? 'step-active' : ''}">
                        <div class="step-dot"></div>
                        <div class="step-label">${step}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const loadOrders = () => {
        const orders = DB.getOrders(currentUser.id);
        ordersContainer.innerHTML = '';

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div style="text-align:center; padding: 6rem 2rem; opacity: 0.8; animation: fadeIn 0.5s;">
                    <i class="fa-solid fa-box-open" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 1.5rem;"></i>
                    <h2 style="margin-bottom: 0.5rem;">No orders yet</h2>
                    <p style="color:var(--text-secondary); margin-bottom: 2rem;">Looks like you haven't placed any orders yet.</p>
                    <a href="shop.html" class="premium-btn" style="display:inline-flex; width:auto; text-decoration:none;">Start Shopping</a>
                </div>
            `;
            return;
        }

        // Sort by Date Descending
        const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedOrders.forEach((order, index) => {
            const card = document.createElement('div');
            card.className = 'order-card-premium';
            card.style.animation = `slideUp 0.4s ease forwards ${index * 0.1}s`;
            card.style.opacity = '0'; // For animation

            // Helpers
            const date = new Date(order.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            let statusClass = 'status-placed';
            if (order.status === 'Shipped') statusClass = 'status-shipped';
            if (order.status === 'Delivered') statusClass = 'status-delivered';
            if (order.status === 'Cancelled') statusClass = 'status-cancelled';

            // Items HTML
            const itemsHtml = order.items.map(item => {
                const product = products.find(p => String(p.id) === String(item.id));
                return product ? `<img src="${product.image}" class="oc-item-thumb" title="${product.title}">` : '';
            }).join('');

            // Actions
            let actionsHtml = '';
            if (['Pending', 'Placed'].includes(order.status)) {
                actionsHtml += `<button class="btn-sm btn-danger-outline btn-cancel" data-id="${order.id}">Cancel Order</button>`;
            }
            if (['Delivered'].includes(order.status) && !order.rating) {
                actionsHtml += `<button class="btn-sm btn-outline btn-rate" data-id="${order.id}"><i class="fa-regular fa-star"></i> Rate Product</button>`;
            } else if (order.rating) {
                actionsHtml += `<div style="color:gold; font-size:0.9rem;"><i class="fa-solid fa-star"></i> ${order.rating.stars}/5</div>`;
            }

            card.innerHTML = `
                <div class="oc-header">
                    <div>
                        <div class="oc-id"><i class="fa-solid fa-receipt"></i> #${order.id}</div>
                        <div class="oc-date">Placed on ${date}</div>
                    </div>
                    <div class="oc-status-badge ${statusClass}">${order.status}</div>
                </div>

                ${renderTracker(order.status)}

                <div class="oc-items">
                    ${itemsHtml}
                </div>

                <div class="oc-footer">
                    <div>
                        <div style="font-size:0.85rem; color:var(--text-secondary);">Total Amount</div>
                        <div class="oc-total">₹${order.total.toFixed(2)}</div>
                    </div>
                    <div class="oc-actions">
                        ${actionsHtml}
                    </div>
                </div>
            `;

            // Attach Event Listeners
            const cancelBtn = card.querySelector('.btn-cancel');
            if (cancelBtn) cancelBtn.addEventListener('click', () => handleCancel(order.id));

            const rateBtn = card.querySelector('.btn-rate');
            if (rateBtn) rateBtn.addEventListener('click', () => openRateModal(order));

            ordersContainer.appendChild(card);
        });
    };

    // --- Actions Logic (Same as before but refined) ---

    const handleCancel = (orderId) => {
        if (confirm('Are you certain you want to cancel this order? This action cannot be undone.')) {
            DB.updateOrder(orderId, { status: 'Cancelled' });
            loadOrders();
            // Optional: Show Toast
        }
    };

    // Rating Modal
    const rateModal = document.getElementById('rateModal');
    let currentRatingOrderId = null;
    let currentRating = 0;

    const openRateModal = (order) => {
        currentRatingOrderId = order.id;
        currentRating = 0;
        updateStars(0);
        document.getElementById('rateComment').value = '';
        if (rateModal) {
            rateModal.style.display = 'flex'; // Ensure flex for centering
            requestAnimationFrame(() => rateModal.classList.add('open')); // Logic handled by styles mostly but this helps if transitions
        }
    };

    const closeRateModal = () => {
        if (rateModal) rateModal.style.display = 'none';
        currentRatingOrderId = null;
    };

    // Star Logic
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-val'));
            currentRating = val;
            updateStars(val);
        });
    });

    const updateStars = (val) => {
        stars.forEach(s => {
            const sVal = parseInt(s.getAttribute('data-val'));
            if (sVal <= val) {
                s.classList.remove('fa-regular');
                s.classList.add('fa-solid');
                s.style.color = 'gold';
            } else {
                s.classList.remove('fa-solid');
                s.classList.add('fa-regular');
                s.style.color = 'var(--text-secondary)';
            }
        });
    };

    document.getElementById('submitRateBtn')?.addEventListener('click', () => {
        if (!currentRatingOrderId) return;
        if (currentRating === 0) {
            alert('Please select a rating of at least 1 star.');
            return;
        }
        const comment = document.getElementById('rateComment').value;
        DB.rateOrder(currentRatingOrderId, currentRating, comment);
        closeRateModal();
        loadOrders();
    });

    document.getElementById('closeRateBtn')?.addEventListener('click', closeRateModal);

    // Initial Load
    loadOrders();
});
