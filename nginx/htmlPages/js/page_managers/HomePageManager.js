class HomePageManager {
    constructor(apiServiceInstance) {
        if (!apiServiceInstance) {
            throw new Error("HomePageManager requires an instance of ApiService.");
        }
        this.apiService = apiServiceInstance;

        // Cache de elementos del DOM
        this.featuredGamesGrid = document.getElementById('featured-games-grid');
        this.recentModsGrid = document.getElementById('recent-mods-grid');
        this.liveStreamsGrid = document.getElementById('live-streams-grid');
        this.viewStreamsLink = document.getElementById('view-streams-link');

        this._initialize();
    }

    async _initialize() {
        this.loadFeaturedGames();
        this.loadRecentMods();
        this.loadLiveStreams();
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

    async loadLiveStreams() {
        if (!this.liveStreamsGrid) {
            console.error("HomePageManager: Elemento 'live-streams-grid' no encontrado en el DOM.");
            return;
        }
    
        this.liveStreamsGrid.innerHTML = '<p class="loading-message">Loading live streams...</p>';
        console.log("HomePageManager: Attempting to load live streams...");
    
        try {
            const streams = await this.apiService.getLiveStreams(); // Llama al endpoint GET /api/streams/live
            console.log("HomePageManager: Received live streams data from API:", streams);
    
            this.liveStreamsGrid.innerHTML = ''; // Limpiar mensaje de "cargando"
    
            if (streams && Array.isArray(streams) && streams.length > 0) {
                streams.forEach(stream => {
                    try {
                        // Asegúrate que _createStreamCardForHome esté definido y funcione
                        const streamCard = this._createStreamCardForHome(stream); 
                        this.liveStreamsGrid.appendChild(streamCard);
                    } catch (cardError) {
                        console.error("HomePageManager: Error creating or appending stream card for stream:", stream, cardError);
                    }
                });
            } else if (streams && streams.length === 0) {
                console.log("HomePageManager: No live streams are currently active.");
                this.liveStreamsGrid.innerHTML = `
                    <p class="placeholder-text">
                        No one is streaming live right now. Be the first!
                    </p>
                `;
            } else {
                console.warn("HomePageManager: Received unexpected data for live streams or no streams available.", streams);
                this.liveStreamsGrid.innerHTML = `
                    <p class="placeholder-text">
                        Could not determine live stream status or no streams available.
                    </p>
                `;
            }
        } catch (error) {
            console.error("HomePageManager: Error in loadLiveStreams API call:", error);
            this.liveStreamsGrid.innerHTML = `
                <p class="status-error">
                    Could not load live streams: ${error.message || 'Unknown server error'}
                </p>
            `;
        }
    }

    _setupStreamLink() {
        // Este es para el botón grande en la sección de streams, no para la nav bar.
        if (!this.viewStreamsLink) return;
    
        // Este botón siempre debe llevar a la página que lista TODOS los streams: live_streams.html
        const currentHostname = window.location.hostname;
        let mainAppDomain = 'servidor-juego.casa.local';
    
        if (currentHostname.includes('cetys.local')) {
            mainAppDomain = 'servidor-juego.cetys.local';
        }
    
        this.viewStreamsLink.href = `http://${mainAppDomain}/live_streams.html`;
    }
    
    

    _createStreamCardForHome(stream) {
        // Renombrada para evitar confusión si tienes otra
        const currentHostnameForLink = window.location.hostname;
        let streamViewingDomain = 'servidor-stream.casa.local';
    
        if (currentHostnameForLink.includes('cetys.local')) {
            streamViewingDomain = 'servidor-stream.cetys.local';
        }
    
        let viewUrl = `http://${streamViewingDomain}/index.html?key=${encodeURIComponent(stream.stream_key)}`;
        const authTokenForLink = authManager.getToken(); // Obtener token de AuthManager
    
        if (authTokenForLink) {
            viewUrl += `&authToken=${encodeURIComponent(authTokenForLink)}`;
        }
    
        const card = document.createElement('a');
        card.href = viewUrl;
        card.className = 'item-card stream-card';
        card.target = '_blank';
    
        card.innerHTML = `
            <img 
                src="${stream.profile_image_url || 'images/default_avatar.png'}" 
                alt="${stream.username}'s stream cover" 
                class="card-cover"
            >
            <div class="item-card-content">
                <h3>${stream.title || `${stream.username}'s Stream`}</h3>
                <p class="streamer-info">Streamer: ${stream.username}</p>
                <p class="game-info">Game: ${stream.game_name || 'Not specified'}</p>
                <span class="live-indicator" style="color:red; font-weight:bold; display:block; margin-top:0.5rem;">
                    🔴 LIVE
                </span>
            </div>
        `;
    
        return card;
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