class HomePageManager {
    constructor(apiServiceInstance) {
        if (!apiServiceInstance) {
            throw new Error("HomePageManager requires an instance of ApiService.");
        }
        this.apiService = apiServiceInstance;

        // Cache de elementos del DOM
        this.featuredGamesGrid = document.getElementById('featured-games-grid');
        this.recentModsGrid = document.getElementById('recent-mods-grid');
        this.viewStreamsLink = document.getElementById('view-streams-link');

        this._initialize();
    }

    async _initialize() {
        this.loadFeaturedGames();
        this.loadRecentMods();
        this._setupStreamLink();
    }

    _createGameCard(game) {
        const card = document.createElement('a');
        // Enlace a games.html; necesitarás JS en games.html para manejar el hash y mostrar ese juego
        card.href = `games.html#game-${game.id}`; 
        card.className = 'item-card'; // Reutilizando la clase de la home
        card.innerHTML = `
            <img src="${game.cover_image_url || 'images/placeholder_game.png'}" alt="Cover for ${game.name}" class="card-cover">
            <div class="item-card-content">
                <h3>${game.name}</h3>
                <p>${(game.description || 'No description available.').substring(0, 80) + ((game.description && game.description.length > 80) ? '...' : '')}</p>
            </div>
        `;
        return card;
    }

    _createModCard(mod) {
        const gameModUrl = `games.html#game-${mod.game_id}`; // Enlace al juego del mod
        const card = document.createElement('a');
        card.href = gameModUrl; 
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-card-content">
                <h3>${mod.mod_name}</h3>
                <p class="game-for-mod">For: ${mod.game_name}</p>
                <p>${(mod.mod_description || 'No description.').substring(0, 80) + ((mod.mod_description && mod.mod_description.length > 80) ? '...' : '')}</p>
                <p><small>By: ${mod.uploaded_by_username || 'Unknown'} on ${new Date(mod.upload_date).toLocaleDateString('en-US')}</small></p>
            </div>
        `;
        return card;
    }

    async loadFeaturedGames() {
        if (!this.featuredGamesGrid) return;
        this.featuredGamesGrid.innerHTML = '<p class="loading-message">Loading featured games...</p>';
        try {
            const games = await this.apiService.getAllGames();
            this.featuredGamesGrid.innerHTML = '';
            if (games && games.length > 0) {
                games.slice(0, 4).forEach(game => { // Mostrar los primeros 4
                    this.featuredGamesGrid.appendChild(this._createGameCard(game));
                });
            } else {
                this.featuredGamesGrid.innerHTML = '<p class="placeholder-text">No games featured at the moment.</p>';
            }
        } catch (error) {
            console.error("Error loading featured games:", error);
            this.featuredGamesGrid.innerHTML = '<p class="status-error">Could not load featured games.</p>';
        }
    }

    async loadRecentMods() {
        if (!this.recentModsGrid) return;
        this.recentModsGrid.innerHTML = '<p class="loading-message">Loading recent mods...</p>';
        try {
            const mods = await this.apiService.getRecentMods(4); // Obtener 4 mods recientes
            this.recentModsGrid.innerHTML = '';
            if (mods && mods.length > 0) {
                mods.forEach(mod => {
                    this.recentModsGrid.appendChild(this._createModCard(mod));
                });
            } else {
                this.recentModsGrid.innerHTML = '<p class="placeholder-text">No recent mods to display.</p>';
            }
        } catch (error) {
            console.error("Error loading recent mods:", error);
            this.recentModsGrid.innerHTML = '<p class="status-error">Could not load recent mods.</p>';
        }
    }
    
    _setupStreamLink() {
        if (!this.viewStreamsLink) return;
        const currentHostname = window.location.hostname;
        let streamDomain = 'servidor-stream.casa.local';
        if (currentHostname.includes('cetys.local')) {
            streamDomain = 'servidor-stream.cetys.local';
        }
        // El enlace de "View Streams" en la home page apunta a la lista de streams en el dominio principal
        this.viewStreamsLink.href = `http://${currentHostname}/live_streams.html`;
    }
}