// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\page_managers\ChatPageManager.js

class ChatPageManager {
    constructor(apiServiceInstance, ioInstance) {
        if (!apiServiceInstance) {
            throw new Error("ChatPageManager requires an instance of ApiService.");
        }
        if (!ioInstance) {
            throw new Error("ChatPageManager requires the Socket.IO client instance (io).");
        }
        this.apiService = apiServiceInstance;
        this.io = ioInstance; // The global io function from socket.io.js

        // Cache de elementos del DOM
        this.searchInput = document.getElementById('searchInput');
        this.searchButton = document.getElementById('searchButton');
        this.searchResultsList = document.getElementById('searchResultsList');
        this.searchStatus = document.getElementById('searchStatus');
        this.pendingRequestsList = document.getElementById('pendingRequestsList');
        this.friendsList = document.getElementById('friendsList');

        this.chatWithTitle = document.getElementById('chat-with-title');
        this.messagesDisplay = document.getElementById('messagesDisplay');
        this.messageInputArea = document.getElementById('messageInputArea');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageButton = document.getElementById('sendMessageButton');
        this.chatPlaceholder = document.getElementById('chatPlaceholder'); // Ensure this ID exists in HTML

        // Estado de la página
        this.currentChatFriendId = null;
        this.currentChatFriendUsername = null;
        this.globalCurrentUserData = null;
        this.socket = null; // Socket connection instance

        this._initialize();
    }

    async _initialize() {
        await this._fetchCurrentUserData();
        if (this.globalCurrentUserData) {
            this._connectSocket();
            this.loadPendingRequests();
            this.loadFriends();
        } else {
            console.warn("User data not available or not authenticated. Chat functionality will be limited.");
            if (this.chatPlaceholder) this.chatPlaceholder.textContent = "Please login to use chat and manage friends.";
            if (this.messageInput) this.messageInput.disabled = true;
            if (this.sendMessageButton) this.sendMessageButton.disabled = true;
            if (this.searchButton) this.searchButton.disabled = true;
            if (this.searchInput) this.searchInput.disabled = true;
        }
        this._bindCoreEvents();
        this._bindDelegatedEvents();
    }

    _bindCoreEvents() {
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => this._performUserSearch());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this._performUserSearch(); });
        }
        if (this.sendMessageButton) {
            this.sendMessageButton.addEventListener('click', () => this._handleSendMessage());
        }
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._handleSendMessage();
                }
                // Typing indicator logic
                if (this.socket && this.socket.connected && this.currentChatFriendId) {
                    this.socket.emit('typing_indicator_private', { recipientId: this.currentChatFriendId, isTyping: true });
                }
            });
            this.messageInput.addEventListener('blur', () => {
                if (this.socket && this.socket.connected && this.currentChatFriendId) {
                    this.socket.emit('typing_indicator_private', { recipientId: this.currentChatFriendId, isTyping: false });
                }
            });
        }
    }

    async _fetchCurrentUserData() {
        const authToken = localStorage.getItem('authToken');
        if (authToken && !this.globalCurrentUserData) {
            try {
                this.globalCurrentUserData = await this.apiService.getMyProfile();
            } catch (error) {
                console.warn("Could not fetch current user data for chat page:", error.message);
                if (error.status === 401 || error.status === 403) { // Token invalid or expired
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUserGameHub');
                    if (typeof renderNavigationBar === 'function') {
                         renderNavigationBar(window.location.pathname.split('/').pop() || 'index.html');
                    }
                    // authGuard.js should ideally handle the redirect
                }
                this.globalCurrentUserData = null;
            }
        } else if (!authToken) {
            this.globalCurrentUserData = null;
        }
    }

    _displaySearchStatus(message, type = 'info') {
        if (!this.searchStatus) return;
        this.searchStatus.textContent = message;
        this.searchStatus.className = 'status-message'; // Reset
        if (type === 'success') this.searchStatus.classList.add('status-success');
        else if (type === 'error') this.searchStatus.classList.add('status-error');
        this.searchStatus.style.display = 'block';
        setTimeout(() => { if (this.searchStatus) this.searchStatus.style.display = 'none'; }, 3000);
    }

    _bindDelegatedEvents() {
        if (this.searchResultsList) {
            this.searchResultsList.addEventListener('click', (e) => {
                if (e.target && e.target.classList.contains('add-friend-btn')) {
                    this._handleAddFriendRequest(e.target.dataset.username, e.target);
                }
            });
        }

        if (this.pendingRequestsList) {
            this.pendingRequestsList.addEventListener('click', (e) => {
                if (e.target && e.target.classList.contains('accept-request-btn')) {
                    this._handleAcceptFriendRequest(e.target.dataset.requesterId);
                } else if (e.target && e.target.classList.contains('decline-request-btn')) {
                    this._handleDeclineFriendRequest(e.target.dataset.requesterId);
                }
            });
        }

        if (this.friendsList) {
            this.friendsList.addEventListener('click', (e) => {
                const listItem = e.target.closest('li[data-friend-id]'); // Asegurar que el click sea en un item de amigo
                if (!listItem) return;

                if (e.target && e.target.classList.contains('unfriend-btn')) {
                    e.stopPropagation(); 
                    this._handleUnfriend(listItem.dataset.friendId);
                } else { 
                    this.startChatWithFriend(listItem.dataset.friendId, listItem.dataset.friendUsername);
                }
            });
        }
    }

    async _performUserSearch() {
        if (!this.searchInput || !this.searchResultsList) return;
        const searchTerm = this.searchInput.value.trim();
        if (searchTerm.length < 2) {
            this._displaySearchStatus("Please enter at least 2 characters to search.", "error");
            return;
        }
        this.searchResultsList.innerHTML = '<li>Loading...</li>';
        try {
            const users = await this.apiService.searchUsers(searchTerm); // Usa el método de la fachada
            this._renderSearchResults(users);
        } catch (error) {
            console.error("Error searching users:", error);
            this.searchResultsList.innerHTML = '<li>Error searching users.</li>';
            this._displaySearchStatus(error.message || "Error during search.", "error");
        }
    }

    _renderSearchResults(users) {
        this.searchResultsList.innerHTML = '';
        if (!users || users.length === 0) {
            this.searchResultsList.innerHTML = '<li>No users found.</li>';
        } else {
            users.forEach(user => {
                const li = document.createElement('li');
                // Suponiendo que globalCurrentUserData y friendsList ya están cargados para chequear
                // si ya es amigo o tiene solicitud pendiente (esto es una mejora, por ahora simple)
                li.innerHTML = `
                    <img src="${user.profile_image_url || 'images/default_avatar.png'}" alt="${user.username}">
                    <span class="username">${user.username}</span>
                    <button class="action-button add-friend-btn" data-username="${user.username}">Add Friend</button>
                `;
                this.searchResultsList.appendChild(li);
            });
            // Los listeners ya están delegados, no es necesario re-bind individual aquí
        }
    }

    async _handleAddFriendRequest(usernameToAdd, buttonElement) {
        try {
            const result = await this.apiService.sendFriendRequest(usernameToAdd);
            this._displaySearchStatus(result.message || `Friend request sent to ${usernameToAdd}.`, "success");
            if (buttonElement) {
                buttonElement.disabled = true;
                buttonElement.textContent = 'Requested';
            }
            this.loadPendingRequests(); // Actualizar lista de pendientes (si la solicitud era para mí)
            // No es necesario this.loadFriends() aquí, solo cuando se acepta.
        } catch (error) {
            console.error("Error sending friend request:", error);
            this._displaySearchStatus(error.message || "Failed to send request.", "error");
        }
    }

    async loadPendingRequests() {
        if (!this.pendingRequestsList || !this.globalCurrentUserData) return; // No cargar si no hay usuario
        this.pendingRequestsList.innerHTML = '<li>Loading...</li>';
        try {
            const requests = await this.apiService.getPendingFriendRequests();
            this._renderPendingRequests(requests);
        } catch (error) {
            console.error("Error loading pending requests:", error);
            this.pendingRequestsList.innerHTML = '<li>Error loading requests.</li>';
        }
    }

    _renderPendingRequests(requests) {
        this.pendingRequestsList.innerHTML = '';
        if (!requests || requests.length === 0) {
            this.pendingRequestsList.innerHTML = '<li>No pending requests.</li>';
        } else {
            requests.forEach(req => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <img src="${req.requester_profile_image_url || 'images/default_avatar.png'}" alt="${req.requester_username}">
                    <span class="username">${req.requester_username}</span>
                    <button class="action-button accept-request-btn" data-requester-id="${req.requester_id}">Accept</button>
                    <button class="action-button decline-button decline-request-btn" data-requester-id="${req.requester_id}">Decline</button>
                `;
                this.pendingRequestsList.appendChild(li);
            });
        }
    }

    async _handleAcceptFriendRequest(requesterId) {
        try {
            await this.apiService.acceptFriendRequest(requesterId);
            alert("Friend request accepted!");
            this.loadPendingRequests();
            this.loadFriends();
        } catch (error) {
            console.error("Error accepting request:", error);
            alert(error.message || "Failed to accept request.");
        }
    }

    async _handleDeclineFriendRequest(requesterId) {
        if (confirm("Are you sure you want to decline this friend request?")) {
            try {
                await this.apiService.declineOrRemoveFriend(requesterId); // API se encarga de la lógica de decline/remove
                alert("Friend request declined.");
                this.loadPendingRequests();
            } catch (error) {
                console.error("Error declining request:", error);
                alert(error.message || "Failed to decline request.");
            }
        }
    }

    async loadFriends() {
        if (!this.friendsList || !this.globalCurrentUserData) return;
        this.friendsList.innerHTML = '<li>Loading...</li>';
        try {
            const friends = await this.apiService.getFriends();
            this._renderFriendsList(friends);
        } catch (error) {
            console.error("Error loading friends:", error);
            this.friendsList.innerHTML = '<li>Error loading friends.</li>';
        }
    }

    _renderFriendsList(friends) {
        this.friendsList.innerHTML = '';
        if (!friends || friends.length === 0) {
            this.friendsList.innerHTML = '<li>You have no friends yet. Find users to add!</li>';
        } else {
            friends.forEach(friend => {
                const li = document.createElement('li');
                li.dataset.friendId = friend.friend_id; // Usado para iniciar chat y para unfriend
                li.dataset.friendUsername = friend.friend_username; // Usado para iniciar chat
                
                // Podríamos añadir un indicador de online/offline si el backend lo proveyera
                li.innerHTML = `
                    <img src="${friend.friend_profile_image_url || 'images/default_avatar.png'}" alt="${friend.friend_username}">
                    <span class="username">${friend.friend_username}</span>
                    <button class="action-button unfriend-btn" data-friend-id="${friend.friend_id}">Unfriend</button>
                `;
                this.friendsList.appendChild(li);
            });
        }
    }
    
    async _handleUnfriend(friendId) {
        // event.stopPropagation() se maneja en el listener delegado
        if (confirm("Are you sure you want to unfriend this user?")) {
            try {
                await this.apiService.declineOrRemoveFriend(friendId);
                alert("User unfriended.");
                this.loadFriends();
                if (this.currentChatFriendId === parseInt(friendId)) {
                    this._closeChatWindow();
                }
            } catch (error) {
                console.error("Error unfriending user:", error);
                alert(error.message || "Failed to unfriend user.");
            }
        }
    }

    _connectSocket() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            console.error("ChatPageManager: No auth token for socket. Chat disabled.");
            this._disableChatInput("Login to chat.");
            return;
        }
        if (this.socket && this.socket.connected) {
            console.log("ChatPageManager: Socket already connected.");
            return;
        }

        this.socket = this.io({ auth: { token: authToken } });

        this.socket.on('connect', () => {
            console.log('ChatPage Socket.IO: Connected to server with ID:', this.socket.id);
            if(this.globalCurrentUserData) {
                console.log(`Socket.IO: User ${this.globalCurrentUserData.username} authenticated for socket.`);
            }
            this._enableChatInput("Type your message...");
        });

        this.socket.on('connect_error', (err) => {
            console.error('ChatPage Socket.IO: Connection Error -', err.message);
            this._disableChatInput("Chat connection error.");
            if (err.message.includes("Authentication error")) {
                alert("Chat authentication failed. Your session might be invalid. Please re-login.");
                // Consider full logout
            }
        });

        this.socket.on('new_private_message', (message) => {
            console.log('ChatPage Socket.IO: Received new_private_message:', message);
            if (this.globalCurrentUserData && 
                ((parseInt(message.sender_id, 10) === this.currentChatFriendId && parseInt(message.recipient_id, 10) === this.globalCurrentUserData.id) ||
                 (parseInt(message.recipient_id, 10) === this.currentChatFriendId && parseInt(message.sender_id, 10) === this.globalCurrentUserData.id)) ) {
                this._appendMessageToDisplay(message, parseInt(message.sender_id, 10) === this.globalCurrentUserData.id ? 'sent' : 'received');
            } else {
                alert(`New private message from ${message.sender_username || 'a user'}!`);
                // Podrías añadir una notificación más sutil o actualizar un contador en la lista de amigos.
            }
        });

        this.socket.on('chat_error', (error) => {
            console.error('ChatPage Socket.IO: Chat Error from server -', error.message);
            alert(`Chat Error: ${error.message || 'An unknown error occurred.'}`);
        });

        this.socket.on('user_typing_private', ({ senderId, isTyping }) => { // Asumiendo este evento para chat privado
            if (senderId === this.currentChatFriendId) {
                this.chatWithTitle.textContent = isTyping 
                    ? `Chat with ${this.currentChatFriendUsername} (typing...)`
                    : `Chat with ${this.currentChatFriendUsername}`;
            }
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('ChatPage Socket.IO: Disconnected -', reason);
            this._disableChatInput("Chat disconnected. Attempting to reconnect...");
        });
    }

    async startChatWithFriend(friendIdStr, friendUsername) {
        const friendId = parseInt(friendIdStr, 10);
        this.currentChatFriendId = friendId;
        this.currentChatFriendUsername = friendUsername;
        
        if (this.chatWithTitle) this.chatWithTitle.textContent = `Chat with ${friendUsername}`;
        if (this.messagesDisplay) this.messagesDisplay.innerHTML = `<p class="placeholder-text">Loading chat history with ${friendUsername}...</p>`;
        if (this.messageInputArea) this.messageInputArea.style.display = 'flex';
        if (this.messageInput) {
            this.messageInput.value = '';
            this.messageInput.focus();
            this.messageInput.disabled = !(this.socket && this.socket.connected);
        }
        if (this.sendMessageButton) this.sendMessageButton.disabled = !(this.socket && this.socket.connected);
        if (this.chatPlaceholder) this.chatPlaceholder.style.display = 'none';

        document.querySelectorAll('#friendsList li').forEach(li => {
            li.classList.remove('active-chat');
            if (parseInt(li.dataset.friendId, 10) === this.currentChatFriendId) {
                li.classList.add('active-chat');
            }
        });

        try {
            const history = await this.apiService.getChatHistory(this.currentChatFriendId);
            this._renderChatHistory(history, friendUsername);
        } catch (error) {
            console.error("Error fetching chat history:", error);
            if (this.messagesDisplay) this.messagesDisplay.innerHTML = `<p class="placeholder-text" style="color:red;">Error loading chat history: ${error.message}</p>`;
        }
    }

    _renderChatHistory(messages, friendUsername) {
        if (!this.messagesDisplay) return;
        this.messagesDisplay.innerHTML = ''; 
        if (messages && messages.length > 0) {
            messages.forEach(msg => {
                this._appendMessageToDisplay(msg, msg.sender_id === this.globalCurrentUserData.id ? 'sent' : 'received');
            });
        } else {
            this.messagesDisplay.innerHTML = `<p class="placeholder-text">No messages yet with ${friendUsername}. Start the conversation!</p>`;
        }
    }

    _appendMessageToDisplay(message, type) {
         if (!this.messagesDisplay || !this.globalCurrentUserData) return;
         const isPlaceholderVisible = this.chatPlaceholder && this.chatPlaceholder.parentNode === this.messagesDisplay;
         if (isPlaceholderVisible) {
            this.messagesDisplay.removeChild(this.chatPlaceholder);
         }

        const msgEl = document.createElement('div');
        msgEl.classList.add('message', type);
        
        const senderName = (type === 'sent') ? 'You' : (message.sender_username || 'Friend');
        
        msgEl.innerHTML = `
            <span class="sender-name">${this._escapeHTML(senderName)}</span>
            ${this._escapeHTML(message.message_text).replace(/\n/g, '<br>')}
            <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        this.messagesDisplay.insertBefore(msgEl, this.messagesDisplay.firstChild);
        this.messagesDisplay.scrollTop = 0; 
    }

    _escapeHTML(str) {
        const div = document.createElement('div');
        if (typeof str === 'string') {
            div.appendChild(document.createTextNode(str));
        } else {
            div.appendChild(document.createTextNode(String(str))); // Fallback for non-strings
        }
        return div.innerHTML;
    }

    _handleSendMessage() {
        if (!this.messageInput || !this.socket || !this.socket.connected || !this.currentChatFriendId || !this.globalCurrentUserData) {
            alert("Cannot send message. Chat not properly initialized or user not logged in.");
            return;
        }
        const messageText = this.messageInput.value.trim();
        
        if (messageText) {
            const messagePayload = {
                recipientId: this.currentChatFriendId,
                text: messageText
            };
            this.socket.emit('private_message', messagePayload);
            
            this.messageInput.value = '';
            this.messageInput.focus();
        }
    }

    _closeChatWindow() { 
        this.currentChatFriendId = null;
        this.currentChatFriendUsername = null;
        if (this.chatWithTitle) this.chatWithTitle.textContent = "Select a Friend to Chat";
        if (this.messagesDisplay) this.messagesDisplay.innerHTML = '<p class="placeholder-text" id="chatPlaceholder">No conversation selected, or no messages yet.</p>';
        if (this.messageInputArea) this.messageInputArea.style.display = 'none';
        if (this.chatPlaceholder) this.chatPlaceholder.style.display = 'block'; // Restaurar placeholder
        
        document.querySelectorAll('#friendsList li.active-chat').forEach(li => li.classList.remove('active-chat'));
    }

    _disableChatInput(placeholderText = "Chat unavailable.") {
        if(this.messageInput) {
            this.messageInput.placeholder = placeholderText;
            this.messageInput.disabled = true;
        }
        if(this.sendMessageButton) this.sendMessageButton.disabled = true;
        if(this.chatPlaceholder && !this.currentChatFriendId) { // Solo mostrar si no hay un chat activo
             this.chatPlaceholder.textContent = placeholderText;
             this.chatPlaceholder.style.display = 'block';
        }
    }

    _enableChatInput(placeholderText = "Type your message...") {
         if(this.messageInput) {
            this.messageInput.placeholder = placeholderText;
            this.messageInput.disabled = false;
        }
        if(this.sendMessageButton) this.sendMessageButton.disabled = false;
    }
}