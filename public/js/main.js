class SBDApp {
    constructor() {
        this.currentTab = 'dashboard';
        this.initialized = {
            dashboard: false,
            agents: false,
            inventory: false,
            locations: false,
            analysis: false
        };
        this.searchTimeout = null;
    }

    async init() {
        console.log('🚀 Initializing SBD System...');
        this.setupEventListeners();
        this.setupGlobalSearch();
        await this.showTab('dashboard');
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.showTab(tabId);
            });
        });

        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const term = document.getElementById('globalSearch').value;
                this.performSearch(term);
            });
        }

        // Modal close functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupGlobalSearch() {
        const searchInput = document.getElementById('globalSearch');
        const searchBtn = document.getElementById('searchBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.performGlobalSearch(e.target.value);
                }, 500);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performGlobalSearch(e.target.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const searchTerm = searchInput.value;
                this.performGlobalSearch(searchTerm);
            });
        }
    }

    async performSearch(term) {
        if (!term) return;
        
        try {
            const response = await sbdApi.searchEquipment(term);
            if (response.success) {
                this.showSearchResults(response.data, term);
            }
        } catch (error) {
            ApiUtils.handleError(error, 'Search');
        }
    }

    async performGlobalSearch(term) {
        if (!term || term.length < 2) {
            return;
        }

        try {
            console.log(`🔍 Searching for: ${term}`);
            
            const [agentsResponse, equipmentResponse] = await Promise.all([
                sbdApi.searchAgents(term),
                sbdApi.searchEquipment(term)
            ]);

            const results = {
                agents: agentsResponse.success ? agentsResponse.data : [],
                equipment: equipmentResponse.success ? equipmentResponse.data : []
            };

            this.showSearchResults(results, term);

        } catch (error) {
            ApiUtils.handleError(error, 'Global search');
        }
    }

    showSearchResults(results, term) {
        const modal = document.getElementById('searchModal');
        const container = document.getElementById('searchResults');
        
        if (!container) return;

        const resultsHtml = results.agents.length > 0 ? `
            <div class="search-section">
                <h4>🖥️ Agentes (${results.agents.length})</h4>
                ${results.agents.map(agent => `
                    <div class="search-result-item" onclick="sbdApp.goToAgent(${agent.agent_id})">
                        <div class="result-title">${agent.pc_name}</div>
                        <div class="result-details">${agent.operating_system} - ${agent.ip_address}</div>
                        <div class="result-location">📍 ${agent.current_location}</div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const equipmentHtml = results.equipment.length > 0 ? `
            <div class="search-section">
                <h4>⚙️ Equipos (${results.equipment.length})</h4>
                ${results.equipment.map(item => `
                    <div class="search-result-item">
                        <div class="result-title">${item.name}</div>
                        <div class="result-details">${item.description}</div>
                        <div class="result-meta">
                            <span class="badge badge-info">${item.item_type}</span>
                            ${item.location ? `<span class="result-location">📍 ${item.location}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        if (results.agents.length === 0 && results.equipment.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    No se encontraron resultados para "${term}"
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="search-results-header">
                    <p>Resultados para: <strong>"${term}"</strong></p>
                </div>
                ${resultsHtml}
                ${equipmentHtml}
            `;
        }

        modal.classList.add('show');
    }

    async showTab(tabId) {
        console.log(`📊 Switching to tab: ${tabId}`);
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');

        if (!this.initialized[tabId]) {
            await this.initializeTab(tabId);
            this.initialized[tabId] = true;
        }

        this.currentTab = tabId;
    }

    async initializeTab(tabId) {
        console.log(`🔧 Initializing ${tabId} tab...`);
        
        try {
            switch (tabId) {
                case 'dashboard':
                    await dashboard.init();
                    break;
                case 'agents':
                    await agentsManager.init();
                    break;
                case 'inventory':
                    await inventoryManager.init();
                    break;
                case 'locations':
                    await locationsManager.init();
                    break;
                case 'analysis':
                    await this.loadAnalysis();
                    break;
            }
        } catch (error) {
            ApiUtils.handleError(error, `Initializing ${tabId} tab`);
        }
    }

    async loadAnalysis() {
        const ramContainer = document.getElementById('ramAnalysisContainer');
        const summaryContainer = document.getElementById('inventorySummaryContainer');
        
        try {
            const ramData = await inventoryManager.loadRamAnalysis();
            
            if (ramContainer && ramData.length > 0) {
                const ramHtml = ramData.map(ram => `
                    <div class="card">
                        <h4>${ram.agent_name}</h4>
                        <p><strong>Motherboard:</strong> ${ram.motherboard_name}</p>
                        <p><strong>Slots usados:</strong> ${ram.slots_used}/4</p>
                        <p><strong>Uso:</strong> ${ram.usage_percentage}%</p>
                        <p><strong>Tipos de RAM:</strong> ${ram.ram_types}</p>
                        <p><strong>Capacidades:</strong> ${ram.ram_sizes}</p>
                        ${ram.total_gb_estimated ? `<p><strong>Total estimado:</strong> ${ram.total_gb_estimated} GB</p>` : ''}
                    </div>
                `).join('');
                ramContainer.innerHTML = ramHtml;
            }

            if (summaryContainer && inventoryManager.inventoryData.summary.length > 0) {
                const totalHardware = inventoryManager.inventoryData.summary.reduce((sum, item) => sum + parseInt(item.hardware_count), 0);
                const totalSoftware = inventoryManager.inventoryData.summary.reduce((sum, item) => sum + parseInt(item.software_count), 0);
                const totalAgents = inventoryManager.inventoryData.summary.length;

                summaryContainer.innerHTML = `
                    <h3>📋 Resumen General</h3>
                    <div class="summary-stats">
                        <div class="summary-stat">
                            <span class="stat-number">${totalAgents}</span>
                            <span class="stat-label">Agentes con Inventario</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-number">${totalHardware}</span>
                            <span class="stat-label">Elementos Hardware</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-number">${totalSoftware}</span>
                            <span class="stat-label">Aplicaciones Software</span>
                        </div>
                    </div>
                `;
            }

        } catch (error) {
            ApiUtils.handleError(error, 'Loading analysis');
        }
    }

    goToAgent(agentId) {
        this.closeAllModals();
        this.showTab('agents').then(() => {
            if (agentsManager.showAgentDetails) {
                agentsManager.showAgentDetails(agentId);
            }
        });
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    refreshCurrentTab() {
        console.log(`🔄 Refreshing ${this.currentTab} tab...`);
        
        switch (this.currentTab) {
            case 'dashboard':
                dashboard.refreshData();
                break;
            case 'agents':
                agentsManager.loadAgents();
                break;
            case 'inventory':
                inventoryManager.loadInventoryData();
                break;
            case 'locations':
                locationsManager.loadLocationsData();
                break;
            case 'analysis':
                this.loadAnalysis();
                break;
        }
    }
}

// Create global app instance
window.sbdApp = new SBDApp();

// Global functions accessible from HTML
window.showTab = (tabId) => {
    sbdApp.showTab(tabId);
};

window.refreshCurrentTab = () => {
    sbdApp.refreshCurrentTab();
};

window.closeModal = () => {
    sbdApp.closeAllModals();
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    sbdApp.init();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh data when user returns to tab
        setTimeout(() => {
            sbdApp.refreshCurrentTab();
        }, 1000);
    }
}); 