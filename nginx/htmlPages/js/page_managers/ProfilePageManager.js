// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\page_managers\ProfilePageManager.js

class ProfilePageManager {
    constructor(apiServiceInstance) {
        if (!apiServiceInstance) {
            throw new Error("ProfilePageManager requires an instance of ApiService.");
        }
        this.apiService = apiServiceInstance;

        // Cache de elementos del DOM
        this.usernameDisplay = document.getElementById('username-display');
        this.emailDisplay = document.getElementById('email-display');
        this.pageMainTitle = document.getElementById('page-main-title');
        
        this.profilePictureImg = document.getElementById('profile-picture');
        this.profilePictureFileInput = document.getElementById('profilePictureFile');
        this.uploadPicStatus = document.getElementById('upload-pic-status');
        this.logoutButtonProfilePage = document.getElementById('logout-button-profile');

        this.inboxList = document.getElementById('inbox-list');
        this.messageDetailView = document.getElementById('message-detail-view');
        this.detailSender = document.getElementById('detail-sender');
        this.detailSubject = document.getElementById('detail-subject');
        this.detailDate = document.getElementById('detail-date');
        this.detailBody = document.getElementById('detail-body');
        this.backToInboxBtn = document.getElementById('back-to-inbox-btn');

        this.composeMessageBtn = document.getElementById('compose-message-btn');
        this.composeModal = document.getElementById('composeModal');
        this.closeComposeModalBtn = document.getElementById('closeComposeModal');
        this.sendMessageForm = document.getElementById('sendMessageForm');
        this.composeStatusMessage = document.getElementById('composeStatusMessage');
        this.recipientUsernameInput = document.getElementById('recipientUsername'); // ID del input en el modal de composición
        this.messageSubjectInput = document.getElementById('messageSubject');
        this.messageBodyInput = document.getElementById('messageBody');


        // Estado de la página
        this.currentUserData = null;

        this._initialize();
    }

    _initialize() {
        this.loadProfileData(); // Esto también llamará a loadInbox
        this._bindCoreEvents();
    }

    _bindCoreEvents() {
        if (this.profilePictureFileInput) {
            this.profilePictureFileInput.addEventListener('change', (event) => this._handleProfilePictureUpload(event));
        }
        if (this.logoutButtonProfilePage) {
            this.logoutButtonProfilePage.addEventListener('click', () => this._handleLogout());
        }
        if (this.composeMessageBtn) {
            this.composeMessageBtn.addEventListener('click', () => this._handleOpenComposeModal());
        }
        if (this.closeComposeModalBtn) {
            this.closeComposeModalBtn.onclick = () => { if (this.composeModal) this.composeModal.style.display = "none"; };
        }
        if (this.sendMessageForm) {
            this.sendMessageForm.addEventListener('submit', (event) => this._handleSubmitSendMessage(event));
        }
        if (this.backToInboxBtn) {
            this.backToInboxBtn.addEventListener('click', () => this._handleBackToInbox());
        }
        
        // Cerrar modal si se hace clic fuera
        window.addEventListener('click', (event) => {
            if (event.target === this.composeModal) {
                this.composeModal.style.display = "none";
            }
        });
    }

    _displayUploadStatus(message, type = 'info', element = this.uploadPicStatus) {
        if (!element) return;
        element.textContent = message;
        element.className = 'status-message'; // Reset classes
        if (type === 'success') element.classList.add('status-success');
        else if (type === 'error') element.classList.add('status-error');
        element.style.display = 'block';
        if (type !== 'info') { // Auto-hide for success/error
           setTimeout(() => { element.style.display = 'none'; }, 4000);
        }
    }

    async loadProfileData() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) { 
            // authGuard.js should have handled this. This is a fallback.
            console.error("ProfilePageManager: No auth token, redirecting via authGuard or manually.");
            if (typeof authGuardRedirect === 'function') authGuardRedirect(); // Si authGuard expone una función
            else window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        try {
            this.currentUserData = await this.apiService.getMyProfile(); 
            
            if(this.usernameDisplay) this.usernameDisplay.textContent = this.currentUserData.username;
            if(this.emailDisplay) this.emailDisplay.textContent = this.currentUserData.email;
            if(this.pageMainTitle) this.pageMainTitle.textContent = `${this.currentUserData.username}'s Profile`;
            
            if (this.currentUserData.profile_image_url) {
                const imageUrl = this.currentUserData.profile_image_url.startsWith('http') 
                               ? this.currentUserData.profile_image_url 
                               : `http://localhost:3000${this.currentUserData.profile_image_url}`;
                if(this.profilePictureImg) this.profilePictureImg.src = imageUrl;
            } else {
                if(this.profilePictureImg) this.profilePictureImg.src = 'images/default_avatar.png';
            }
            
            localStorage.setItem('currentUserGameHub', JSON.stringify(this.currentUserData));
            this.loadInbox();

        } catch (error) {
            console.error("Error loading profile data:", error);
            if(this.usernameDisplay) this.usernameDisplay.textContent = "Error loading data.";
            if(this.emailDisplay) this.emailDisplay.textContent = "Please login again.";
            if (error.requiresLogin || error.status === 401 || error.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUserGameHub');
                alert("Your session may have expired. Please login again.");
                window.location.href = 'login.html';
            }
        }
    }
    
    async loadInbox() {
        if (!this.inboxList) return;
        this.inboxList.innerHTML = '<li>Loading messages...</li>';
        if(this.messageDetailView) this.messageDetailView.style.display = 'none';
        try {
            const messages = await this.apiService.getInternalInbox();
            this.inboxList.innerHTML = ''; 
            if (messages.length === 0) {
                this.inboxList.innerHTML = '<li>Your inbox is empty.</li>';
                return;
            }
            messages.forEach(msg => {
                const item = document.createElement('li');
                item.className = 'message-item';
                if (!msg.is_read) {
                    item.classList.add('unread');
                }
                item.innerHTML = `
                    <div>
                        <strong>From:</strong> ${msg.sender_username}<br>
                        <strong>Subject:</strong> ${msg.subject}
                    </div>
                    <div class="meta">${new Date(msg.sent_at).toLocaleString('en-US')}</div>
                `;
                item.dataset.messageId = msg.id;
                item.addEventListener('click', () => this.showMessageDetail(msg.id));
                this.inboxList.appendChild(item);
            });
        } catch (error) {
            console.error("Error loading inbox:", error);
            this.inboxList.innerHTML = `<li style="color:red;">Error loading messages: ${error.message}</li>`;
        }
    }

    async showMessageDetail(messageId) {
        if(this.inboxList) this.inboxList.style.display = 'none'; 
        if(this.messageDetailView) this.messageDetailView.style.display = 'block';
        
        if(this.detailSender) this.detailSender.textContent = 'Loading...';
        if(this.detailSubject) this.detailSubject.textContent = '';
        if(this.detailDate) this.detailDate.textContent = '';
        if(this.detailBody) this.detailBody.textContent = '';

        try {
            const message = await this.apiService.getInternalMessageById(messageId);
            if(this.detailSender) this.detailSender.textContent = message.sender_username;
            if(this.detailSubject) this.detailSubject.textContent = message.subject;
            if(this.detailDate) this.detailDate.textContent = new Date(message.sent_at).toLocaleString('en-US');
            if(this.detailBody) this.detailBody.textContent = message.body;

            const listItem = this.inboxList.querySelector(`li[data-message-id="${messageId}"]`);
            if(listItem && listItem.classList.contains('unread')){
                listItem.classList.remove('unread');
            }
        } catch (error) {
            console.error("Error loading message detail:", error);
            if(this.detailBody) this.detailBody.textContent = `Error loading message: ${error.message}`;
        }
    }

    _handleBackToInbox() {
        if(this.messageDetailView) this.messageDetailView.style.display = 'none';
        if(this.inboxList) this.inboxList.style.display = 'block';
        // Consider reloading inbox to reflect read status accurately if not done by just removing class
        // this.loadInbox(); 
    }

    async _handleProfilePictureUpload(event) {
        const file = event.target.files[0];
        if (!file || !this.apiService) return;

        const formData = new FormData();
        formData.append('profilePictureFile', file);

        this._displayUploadStatus('Uploading...', 'info');
        const originalButtonLabel = this.profilePictureFileInput.labels[0];
        const originalButtonText = originalButtonLabel ? originalButtonLabel.textContent : "Change Picture";
        if (originalButtonLabel) originalButtonLabel.textContent = "Uploading...";


        try {
            const result = await this.apiService.uploadProfilePicture(formData);
            if (result && result.profile_image_url) {
                const imageUrl = result.profile_image_url.startsWith('http') 
                                    ? result.profile_image_url 
                                    : `http://localhost:3000${result.profile_image_url}`;
                if(this.profilePictureImg) this.profilePictureImg.src = `${imageUrl}?timestamp=${new Date().getTime()}`; // Cache buster
                this._displayUploadStatus(result.message || "Picture updated successfully!", 'success');
                
                if(this.currentUserData) {
                    this.currentUserData.profile_image_url = result.profile_image_url; // Store base URL
                    localStorage.setItem('currentUserGameHub', JSON.stringify(this.currentUserData));
                }
            } else {
                 throw new Error("Profile picture URL not returned from server.");
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            this._displayUploadStatus(error.message || "Failed to upload picture.", 'error');
        } finally {
            if (originalButtonLabel) originalButtonLabel.textContent = originalButtonText;
        }
    }

    _handleLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUserGameHub');
        alert("You have been successfully logged out.");
        window.location.href = 'login.html';
    }
    
    _handleOpenComposeModal() {
        if (!this.currentUserData) { 
            alert("User data not fully loaded. Please wait or try re-logging in.");
            return;
        }
        if(this.sendMessageForm) this.sendMessageForm.reset();
        if(this.composeStatusMessage) this.composeStatusMessage.style.display = 'none';
        if(this.composeModal) this.composeModal.style.display = 'block';
    }

    async _handleSubmitSendMessage(event) {
        event.preventDefault();
        const form = event.target; // o this.sendMessageForm

        const recipientUsername = this.recipientUsernameInput.value; // Usando la referencia cacheada
        const subject = this.messageSubjectInput.value;
        const body = this.messageBodyInput.value;

        if(this.composeStatusMessage) this.composeStatusMessage.style.display = 'none';
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            const data = await this.apiService.sendInternalMessage(recipientUsername, subject, body);
            this._displayUploadStatus(data.message || "Message sent successfully.", 'success', this.composeStatusMessage);
            form.reset();
            setTimeout(() => {
                if (this.composeModal) this.composeModal.style.display = "none";
                this.loadInbox(); 
            }, 1500);
        } catch (error) {
            console.error("Error sending internal message:", error);
            this._displayUploadStatus(error.message || "Failed to send message.", 'error', this.composeStatusMessage);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            if (this.composeStatusMessage) this.composeStatusMessage.style.display = 'block';
        }
    }
}