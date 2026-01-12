/**
 * DB.js - Local Database Simulation using localStorage
 * Handles Users and Orders persistence.
 */
class DB {
    static init() {
        if (!localStorage.getItem('hbazaar_users')) {
            localStorage.setItem('hbazaar_users', JSON.stringify([]));
        }
        if (!localStorage.getItem('hbazaar_orders')) {
            localStorage.setItem('hbazaar_orders', JSON.stringify([]));
        }
        if (!localStorage.getItem('hbazaar_current_user')) {
            localStorage.setItem('hbazaar_current_user', JSON.stringify(null));
        }
    }

    // --- USERS ---
    static getUsers() {
        return JSON.parse(localStorage.getItem('hbazaar_users') || '[]');
    }

    static registerUser(name, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already exists' };
        }
        const newUser = {
            id: 'USR-' + Date.now(),
            name,
            email,
            password, // In a real app, hash this!
            role: 'customer',
            joined: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('hbazaar_users', JSON.stringify(users));
        this.loginUser(email, password); // Auto login
        return { success: true, user: newUser };
    }

    static loginUser(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            // Remove password from session
            const { password, ...safeUser } = user;
            localStorage.setItem('hbazaar_current_user', JSON.stringify(safeUser));
            return { success: true, user: safeUser };
        }
        return { success: false, message: 'Invalid credentials' };
    }

    static logout() {
        localStorage.removeItem('hbazaar_current_user');
        window.location.href = 'index.html';
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('hbazaar_current_user'));
    }

    static updateUser(userId, updates) {
        let users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            // Update in users array
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('hbazaar_users', JSON.stringify(users));

            // Update current user session if it's the same user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                const { password, ...safeUser } = users[index];
                localStorage.setItem('hbazaar_current_user', JSON.stringify(safeUser));
            }
            return { success: true, user: users[index] };
        }
        return { success: false, message: 'User not found' };
    }

    static addAddress(userId, address) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found' };

        const newAddress = { id: 'ADDR-' + Date.now(), ...address };
        const addresses = user.addresses || [];
        addresses.push(newAddress);

        return this.updateUser(userId, { addresses });
    }

    static removeAddress(userId, addressId) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return { success: false, message: 'User not found' };

        const addresses = (user.addresses || []).filter(a => a.id !== addressId);
        return this.updateUser(userId, { addresses });
    }

    // --- ORDERS ---
    static getOrders(userId = null) {
        let orders = JSON.parse(localStorage.getItem('hbazaar_orders') || '[]');
        if (userId) {
            return orders.filter(o => o.userId === userId);
        }
        return orders;
    }

    static createOrder(orderData) {
        const orders = this.getOrders();
        const currentUser = this.getCurrentUser();

        const newOrder = {
            id: 'ORD-' + Math.floor(Math.random() * 1000000),
            userId: currentUser ? currentUser.id : 'GUEST',
            date: new Date().toISOString(),
            status: 'Pending',
            history: [{ status: 'Placed', date: new Date().toISOString() }],
            ...orderData
        };

        orders.push(newOrder);
        localStorage.setItem('hbazaar_orders', JSON.stringify(orders));
        return newOrder;
    }

    static updateOrder(orderId, updates) {
        let orders = this.getOrders();
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates };
            // Track history if status changed
            if (updates.status) {
                if (!orders[index].history) orders[index].history = [];
                orders[index].history.push({ status: updates.status, date: new Date().toISOString() });
            }
            localStorage.setItem('hbazaar_orders', JSON.stringify(orders));
            return true;
        }
        return false;
    }

    static rateOrder(orderId, rating, comment) {
        // Find order and update with rating
        const success = this.updateOrder(orderId, {
            rating: {
                stars: rating,
                comment: comment,
                date: new Date().toISOString()
            }
        });
        return success;
    }
    // --- PRODUCTS ---
    static getProducts() {
        return [
            { id: 1, title: 'Neon City Rain', price: 290.00, image: 'https://picsum.photos/seed/hbazaar1/800/600', description: 'A futuristic city bathed in neon rain.' },
            { id: 2, title: 'Cosmic Void', price: 490.00, image: 'https://picsum.photos/seed/hbazaar2/800/600', description: 'Ancient ruins floating in a void of stars.' },
            { id: 3, title: 'Cyberpunk Vendor', price: 340.00, image: 'https://picsum.photos/seed/hbazaar3/800/600', description: 'A cyberpunk street vendor selling digital dreams.' },
            { id: 4, title: 'Geometric Dance', price: 190.0000, image: 'https://picsum.photos/seed/hbazaar4/800/600', description: 'Abstract geometric shapes dancing in light.' },
            { id: 5, title: 'Crystal Peaks', price: 590.00, image: 'https://picsum.photos/seed/hbazaar5/800/600', description: 'A serene landscape of crystal mountains.' },
            { id: 6, title: 'Mecha Dragon', price: 890.00, image: 'https://picsum.photos/seed/hbazaar6/800/600', description: 'Mechanical dragon resting on a skyscraper.' },
            { id: 7, title: 'Deep Sea Glow', price: 240.00, image: 'https://picsum.photos/seed/hbazaar7/800/600', description: 'Underwater civilization glowing with bioluminescence.' },
            { id: 8, title: 'Electric Sheep', price: 390.00, image: 'https://picsum.photos/seed/hbazaar8/800/600', description: 'Portrait of an AI dreaming of sheep.' },
            { id: 9, title: 'Glass Forest', price: 440.00, image: 'https://picsum.photos/seed/hbazaar9/800/600', description: 'A forest made of glass and refraction.' }
        ];
    }
}

// Initialize on load
DB.init();
