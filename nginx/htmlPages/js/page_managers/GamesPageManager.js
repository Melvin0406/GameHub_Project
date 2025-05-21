// C:\Users\kevin\Documents\GitHub\GameHub_Project\nginx\htmlPages\js\page_managers\GamesPageManager.js

class GamesPageManager {
    constructor(apiServiceInstance) {
        if (!apiServiceInstance) {
            throw new Error("GamesPageManager requires an instance of ApiService.");
        }
        this.apiService = apiServiceInstance;

        // Cache de elementos del DOM
        this.gameGridContainer = document.getElementById('game-grid-container');
        this.gamesListSection = document.getElementById('games-list-section');
        
        this.gameDetailSection = document.getElementById('game-detail-section');
        this.gameDetailCover = document.getElementById('game-detail-cover');
        this.gameDetailTitle = document.getElementById('game-detail-title');
        this.gameDetailDescription = document.getElementById('game-detail-description');
        this.modListContainer = document.getElementById('mod-list-container');
        this.backToGamesButton = document.getElementById('back-to-games');

        this.uploadModSection = document.getElementById('upload-mod-section');
        this.uploadModForm = document.getElementById('uploadModForm');
        this.uploadStatusMessage = document.getElementById('uploadStatusMessage');

        this.editModModal = document.getElementById('editModModal');
        this.closeEditModModalBtn = document.getElementById('closeEditModModal');
        this.editModForm = document.getElementById('editModForm');
        this.editModIdInput = document.getElementById('editModIdInput');
        this.editModNameInput = document.getElementById('editModName');
        this.editModVersionInput = document.getElementById('editModVersion');
        this.editModDescriptionInput = document.getElementById('editModDescription');
        this.editModStatusMessage = document.getElementById('editModStatusMessage');

        this.adminActionsGamesDiv = document.getElementById('admin-actions-games');
        this.addNewGameBtn = document.getElementById('add-new-game-btn');
        this.addGameModal = document.getElementById('addGameModal');
        this.closeAddGameModalBtn = document.getElementById('closeAddGameModal');
        this.addGameForm = document.getElementById('addGameForm');
        this.addGameStatusMessage = document.getElementById('addGameStatusMessage');
        
        // Estado de la página
        this.currentSelectedGame = null;
        this.globalCurrentUserData = null; // Para datos del usuario logueado

        this._initialize();
    }

    async _initialize() {
        await this._fetchCurrentUserData(); // Cargar datos del usuario primero
        this.loadGames();
        this._bindCoreEvents();

        if (this.globalCurrentUserData) { // Si el usuario está logueado
            if(this.adminActionsGamesDiv) this.adminActionsGamesDiv.style.display = 'block';
        } else {
            if(this.adminActionsGamesDiv) this.adminActionsGamesDiv.style.display = 'none';
        }
    }

    _bindCoreEvents() {
        if (this.backToGamesButton) {
            this.backToGamesButton.addEventListener('click', () => this.showGamesList());
        }

        if (this.uploadModForm) {
            this.uploadModForm.addEventListener('submit', (event) => this._handleSubmitUploadModForm(event));
        }

        if (this.closeEditModModalBtn) {
            this.closeEditModModalBtn.onclick = () => {
                if (this.editModModal) this.editModModal.style.display = "none";
            };
        }

        if (this.addNewGameBtn) {
            this.addNewGameBtn.addEventListener('click', () => this._handleOpenAddGameModal());
        }

        if (this.closeAddGameModalBtn) {
            this.closeAddGameModalBtn.onclick = () => {
                if (this.addGameModal) this.addGameModal.style.display = "none";
            };
        }
        
        // Cerrar modal de edición si se hace clic fuera (este listener es mejor ponerlo una vez)
        window.addEventListener('click', (event) => {
            if (event.target === this.editModModal) {
                this.editModModal.style.display = "none";
            }
            if (event.target === this.addGameModal) {
                this.addGameModal.style.display = "none";
            }
        });

        if (this.addGameForm) {
            this.addGameForm.addEventListener('submit', (event) => this._handleSubmitAddGameForm(event));
        }

        if (this.editModForm) {
            this.editModForm.addEventListener('submit', (event) => this._handleSubmitEditModForm(event));
        }
    }

    async _fetchCurrentUserData() {
        const authToken = localStorage.getItem('authToken');
        if (authToken && !this.globalCurrentUserData) {
            try {
                this.globalCurrentUserData = await this.apiService.getMyProfile();
            } catch (error) {
                console.warn("Could not fetch current user data for games page:", error.message);
                if (error.status === 401 || error.status === 403) { // Token inválido o expirado
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUserGameHub');
                    // Re-renderizar la nav puede ser manejado por navigation.js al detectar cambio de auth
                    if (typeof renderNavigationBar === 'function') {
                         renderNavigationBar(window.location.pathname.split('/').pop() || 'index.html');
                    }
                }
                this.globalCurrentUserData = null;
            }
        }
    }

    _createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        // No es necesario guardar todos los datos en dataset si pasas el objeto 'game' directamente
        card.innerHTML = `
            <img src="${game.cover_image_url || 'images/placeholder_game.png'}" alt="Cover for ${game.name}" class="game-cover">
            <div class="game-card-content">
                <h3>${game.name}</h3>
                <p class="game-description">${game.description || 'No description available.'}</p>
            </div>
            <span class="game-card-button">View Mods</span>
        `;
        card.addEventListener('click', () => this.loadGameDetails(game)); // Pasa el objeto juego completo
        return card;
    }

    async loadGames() {
        if (!this.gameGridContainer) return;
        this.gameGridContainer.innerHTML = '<p class="loading-message">Loading games...</p>';
        try {
            const games = await this.apiService.getAllGames();
            this.gameGridContainer.innerHTML = ''; 
            if (!games || games.length === 0) {
                this.gameGridContainer.innerHTML = '<p>No games available at the moment.</p>';
                return;
            }
            games.forEach(game => {
                this.gameGridContainer.appendChild(this._createGameCard(game));
            });
        } catch (error) {
            console.error("Error loading games:", error);
            this.gameGridContainer.innerHTML = `<p class="status-error">Error loading games: ${error.message}</p>`;
        }
    }

    _createModListItem(mod, gameFtpFolder) { // gameFtpFolder ya no es necesario para la URL de descarga
        const listItem = document.createElement('li');
        listItem.className = 'mod-item';
        const downloadUrl = `/api/games/mods/download/${mod.id}`; 
        const fileSizeMB = mod.file_size ? (mod.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A';
        
        let actionButtonsHtml = `<a href="${downloadUrl}" title="Download ${mod.file_name}">Download</a>`;
        const loggedInUserId = this.globalCurrentUserData ? this.globalCurrentUserData.id : null;

        if (loggedInUserId && mod.user_id === loggedInUserId) {
            actionButtonsHtml += ` <button class="edit-mod-btn" 
                                        data-mod-id="${mod.id}" 
                                        data-mod-name="${mod.name}"
                                        data-mod-version="${mod.version || ''}"
                                        data-mod-description="${mod.description || ''}">Edit</button>`;
            actionButtonsHtml += ` <button class="delete-mod-btn" 
                                        data-mod-id="${mod.id}" 
                                        data-mod-name="${mod.name}">Delete</button>`;
        }

        listItem.innerHTML = `
            <div class="mod-info">
                <h4>${mod.name} (v${mod.version || 'N/A'})</h4>
                <p>${mod.description || 'No description.'}</p>
                <p><small>File: ${mod.file_name} | Size: ${fileSizeMB}</small></p>
                <p><small>Uploaded by: ${mod.uploaded_by_username || 'Unknown'} on ${new Date(mod.upload_date).toLocaleDateString('en-US')}</small></p>
            </div>
            <div class="mod-actions">
                ${actionButtonsHtml}
            </div>
        `;
        return listItem;
    }

    async loadGameDetails(game) {
        this.currentSelectedGame = game;
        this.gamesListSection.style.display = 'none';
        this.gameDetailSection.style.display = 'block';
        
        this.gameDetailCover.src = game.cover_image_url || 'images/placeholder_game.png';
        this.gameDetailCover.alt = `Cover for ${game.name}`;
        this.gameDetailTitle.textContent = game.name;
        this.gameDetailDescription.textContent = game.description || 'No detailed description for this game.';
        
        this.modListContainer.innerHTML = '<p class="loading-message">Loading mods...</p>';
        if (localStorage.getItem('authToken')) { // O usar this.globalCurrentUserData
            this.uploadModSection.style.display = 'block';
        } else {
            this.uploadModSection.style.display = 'none';
        }

        try {
            const gameDetailsWithMods = await this.apiService.getGameDetails(game.id);
            this.modListContainer.innerHTML = '';
            if (!gameDetailsWithMods.mods || gameDetailsWithMods.mods.length === 0) {
                this.modListContainer.innerHTML = '<li>No mods available for this game. Be the first to upload one!</li>';
            } else {
                gameDetailsWithMods.mods.forEach(mod => {
                    this.modListContainer.appendChild(this._createModListItem(mod, game.ftp_folder_name));
                });
            }

            this._bindDynamicModButtons(); // Añadir listeners a los nuevos botones

        } catch (error) {
            console.error(`Error loading mods for game ${game.id}:`, error);
            this.modListContainer.innerHTML = `<li class="status-error">Error loading mods: ${error.message}</li>`;
        }
    }
    
    _bindDynamicModButtons() {
        this.modListContainer.querySelectorAll('.delete-mod-btn').forEach(button => {
            // Remover listener previo para evitar duplicados si se llama varias veces loadGameDetails
            button.replaceWith(button.cloneNode(true)); 
        });
        this.modListContainer.querySelectorAll('.edit-mod-btn').forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });

        // Añadir nuevos listeners
        this.modListContainer.querySelectorAll('.delete-mod-btn').forEach(button => {
            button.addEventListener('click', (event) => this._handleDeleteMod(event));
        });
        this.modListContainer.querySelectorAll('.edit-mod-btn').forEach(button => {
            button.addEventListener('click', (event) => this._handleOpenEditModal(event));
        });
    }

    showGamesList() {
        this.gameDetailSection.style.display = 'none';
        this.gamesListSection.style.display = 'block';
        this.currentSelectedGame = null;
        if (this.uploadModSection) this.uploadModSection.style.display = 'none';
    }

    async _handleDeleteMod(event) {
        const modId = event.target.dataset.modId;
        const modName = event.target.dataset.modName;
        if (confirm(`Are you sure you want to delete the mod "${modName}"? This action cannot be undone.`)) {
            try {
                const result = await this.apiService.deleteMod(modId);
                alert(result.message || "Mod deleted successfully.");
                if (this.currentSelectedGame) this.loadGameDetails(this.currentSelectedGame);
                else this.showGamesList();
            } catch (error) {
                console.error("Error deleting mod:", error);
                alert(`Failed to delete mod: ${error.message}`);
            }
        }
    }

    _handleOpenEditModal(event) {
        const modId = event.target.dataset.modId;
        const modName = event.target.dataset.modName;
        const modVersion = event.target.dataset.modVersion;
        const modDescription = event.target.dataset.modDescription;

        this.editModIdInput.value = modId;
        this.editModNameInput.value = modName;
        this.editModVersionInput.value = modVersion;
        this.editModDescriptionInput.value = modDescription;
        
        this.editModStatusMessage.style.display = 'none';
        this.editModModal.style.display = 'block';
    }

    async _handleSubmitUploadModForm(event) {
        event.preventDefault();
        const form = event.target; // 'this' dentro de un event listener normal es el elemento, no la clase
                                 // Pero como usé una arrow function en _bindCoreEvents, 'this' es la instancia de la clase.
                                 // O podemos usar form = this.uploadModForm;

        const authToken = localStorage.getItem('authToken');
        if (!authToken) { alert("You must be logged in to upload mods."); return; }
        if (!this.currentSelectedGame || !this.currentSelectedGame.id) { alert("Error: No game selected for mod upload."); return; }

        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';
        this.uploadStatusMessage.style.display = 'none';
        this.uploadStatusMessage.className = 'status-message';

        try {
            const data = await this.apiService.uploadMod(this.currentSelectedGame.id, formData);
            this.uploadStatusMessage.textContent = data.message || "Mod uploaded successfully.";
            this.uploadStatusMessage.classList.add('status-success');
            form.reset(); 
            this.loadGameDetails(this.currentSelectedGame); 
        } catch (error) {
            console.error("Error uploading mod:", error);
            this.uploadStatusMessage.textContent = error.message || "Network or server error while uploading mod.";
            this.uploadStatusMessage.classList.add('status-error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            this.uploadStatusMessage.style.display = 'block';
        }
    }

    async _handleSubmitEditModForm(event) {
        event.preventDefault();
        const form = event.target; // o this.editModForm
        const modId = this.editModIdInput.value;
        const name = this.editModNameInput.value;
        const version = this.editModVersionInput.value;
        const description = this.editModDescriptionInput.value;

        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        this.editModStatusMessage.style.display = 'none';
        this.editModStatusMessage.className = 'status-message';

        try {
            const result = await this.apiService.updateModDetails(modId, { name, description, version });
            this.editModStatusMessage.textContent = result.message || "Mod details updated successfully.";
            this.editModStatusMessage.classList.add('status-success');
            
            setTimeout(() => {
                this.editModModal.style.display = "none";
                if (this.currentSelectedGame) this.loadGameDetails(this.currentSelectedGame); 
            }, 1500);
        } catch (error) {
            console.error("Error updating mod details:", error);
            this.editModStatusMessage.textContent = error.message || "Failed to update mod details.";
            this.editModStatusMessage.classList.add('status-error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            this.editModStatusMessage.style.display = 'block';
        }
    }

    _handleOpenAddGameModal() {
        if (!this.globalCurrentUserData) { // Doble chequeo
            alert("You need to be logged in to add games.");
            return;
        }
        if (this.addGameForm) this.addGameForm.reset();
        if (this.addGameStatusMessage) this.addGameStatusMessage.style.display = 'none';
        if (this.addGameModal) this.addGameModal.style.display = 'block';
    }
    
    async _handleSubmitAddGameForm(event) {
        event.preventDefault();
        const form = event.target; // o this.addGameForm
    
        const gameData = {
            name: form.name.value,
            description: form.description.value,
            cover_image_url: form.cover_image_url.value,
            ftp_folder_name: form.ftp_folder_name.value
        };
    
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Game...';
        if (this.addGameStatusMessage) {
            this.addGameStatusMessage.style.display = 'none';
            this.addGameStatusMessage.className = 'status-message';
        }
    
        try {
            const result = await this.apiService.createGame(gameData);
            if (this.addGameStatusMessage) {
                this.addGameStatusMessage.textContent = result.message || "Game created successfully!";
                this.addGameStatusMessage.classList.add('status-success');
            } else {
                alert(result.message || "Game created successfully!");
            }
    
            form.reset();
            this.loadGames(); // Refrescar la lista de juegos
            setTimeout(() => {
                if (this.addGameModal) this.addGameModal.style.display = "none";
            }, 1500);
    
        } catch (error) {
            console.error("Error creating game:", error);
            if (this.addGameStatusMessage) {
                this.addGameStatusMessage.textContent = error.message || "Failed to create game.";
                this.addGameStatusMessage.classList.add('status-error');
            } else {
                alert(error.message || "Failed to create game.");
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            if (this.addGameStatusMessage) this.addGameStatusMessage.style.display = 'block';
        }
    }
}