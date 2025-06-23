class AgentsManager {
    constructor() {
        this.agents = [];
        this.filteredAgents = [];
        this.searchTerm = '';
        this.selectedAgent = null;
    }

    // Initialize agents management
    async init() {
        console.log('🖥️ Initializing Agents Manager...');
        await this.loadAgents();
        this.setupEventListeners();
    }

    // Load all agents
    async loadAgents() {
        try {
            ApiUtils.showLoading('agentsContainer');
            
            const response = await sbdApi.getAgents();
            
            if (response.success && response.data) {
                this.agents = response.data;
                this.filteredAgents = [...this.agents];
                this.renderAgents();
            } else {
                throw new Error('No agents data received');
            }
        } catch (error) {
            ApiUtils.handleError(error, 'Loading agents');
            document.getElementById('agentsContainer').innerHTML = 
                '<div class="alert alert-error">Error cargando agentes</div>';
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('agentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', 
                ApiUtils.debounce((e) => this.handleSearch(e.target.value), 300)
            );
        }
    }

    // Handle search
    handleSearch(term) {
        this.searchTerm = term.toLowerCase();
        
        if (!term) {
            this.filteredAgents = [...this.agents];
        } else {
            this.filteredAgents = this.agents.filter(agent =>
                agent.pc_name.toLowerCase().includes(this.searchTerm) ||
                agent.operating_systems.toLowerCase().includes(this.searchTerm) ||
                agent.ip_address.includes(this.searchTerm) ||
                (agent.current_location && agent.current_location.toLowerCase().includes(this.searchTerm))
            );
        }
        
        this.renderAgents();
    }

    // Render agents list
    renderAgents() {
        const container = document.getElementById('agentsContainer');
        if (!container) return;

        if (this.filteredAgents.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    ${this.searchTerm ? 'No se encontraron agentes que coincidan con la búsqueda.' : 'No hay agentes disponibles.'}
                </div>
            `;
            return;
        }

        const agentsHtml = this.filteredAgents.map(agent => `
            <div class="list-group-item" onclick="agentsManager.showAgentDetails(${agent.agent_id})">
                <div class="agent-card">
                    <div class="agent-header">
                        <h4>🖥️ ${agent.pc_name}</h4>
                        <div class="agent-status">
                            <span class="status-indicator">
                                <span class="status-dot online"></span>
                                En línea
                            </span>
                        </div>
                    </div>
                    <div class="agent-details">
                        <p><strong>SO:</strong> ${agent.operating_systems}</p>
                        <p><strong>IP:</strong> ${agent.ip_address}</p>
                        <p><strong>Ubicación:</strong> ${agent.current_location || 'Sin asignar'}</p>
                        <p><strong>Medio Básico:</strong> ${agent.basic_media_number}</p>
                        ${agent.location_since ? `<p><strong>En ubicación desde:</strong> ${ApiUtils.formatDate(agent.location_since)}</p>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="agents-summary">
                <p>Mostrando ${this.filteredAgents.length} de ${this.agents.length} agentes</p>
            </div>
            <div class="list-group">
                ${agentsHtml}
            </div>
        `;
    }

    // Show agent details in modal
    async showAgentDetails(agentId) {
        try {
            this.selectedAgent = this.agents.find(agent => agent.agent_id === agentId);
            
            if (!this.selectedAgent) {
                throw new Error('Agent not found');
            }

            // Load complete agent information
            const [detailsResponse, ramResponse] = await Promise.all([
                sbdApi.getAgentDetails(agentId),
                sbdApi.getAgentRam(agentId)
            ]);

            let agentDetails = this.selectedAgent;
            let ramInfo = [];

            if (detailsResponse.success && detailsResponse.data) {
                agentDetails = { ...agentDetails, ...detailsResponse.data };
            }

            if (ramResponse.success && ramResponse.data) {
                ramInfo = ramResponse.data;
            }

            this.renderAgentModal(agentDetails, ramInfo);
            this.showModal('agentModal');

        } catch (error) {
            ApiUtils.handleError(error, 'Loading agent details');
        }
    }

    // Render agent details modal
    renderAgentModal(agent, ramInfo) {
        const modalBody = document.querySelector('#agentModal .modal-body');
        if (!modalBody) return;

        const ramInfoHtml = ramInfo.length > 0 ? `
            <div class="info-card">
                <div class="info-card-header">
                    <h4 class="info-card-title">🧠 Información de Memoria RAM</h4>
                </div>
                <div class="info-card-content">
                    ${ramInfo.map(ram => `
                        <div class="ram-slot">
                            <strong>Slot ${ram.slot_number}:</strong> 
                            ${ram.ram_type} ${ram.ram_dimension} (${ram.data_width})
                            <br><small>Motherboard: ${ram.motherboard_name}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '<div class="alert alert-info">No hay información de RAM disponible</div>';

        modalBody.innerHTML = `
            <div class="agent-details-modal">
                <div class="info-card">
                    <div class="info-card-header">
                        <h4 class="info-card-title">📋 Información General</h4>
                    </div>
                    <div class="info-card-content">
                        <p><strong>Nombre del PC:</strong> ${agent.pc_name || agent.agent_name}</p>
                        <p><strong>Sistema Operativo:</strong> ${agent.operating_systems || agent.operating_system}</p>
                        <p><strong>Dirección IP:</strong> ${agent.ip_address}</p>
                        <p><strong>Ubicación Actual:</strong> ${agent.current_location}</p>
                        <p><strong>Medio Básico:</strong> ${agent.basic_media_number}</p>
                    </div>
                </div>

                <div class="info-card">
                    <div class="info-card-header">
                        <h4 class="info-card-title">📊 Estadísticas de Inventario</h4>
                    </div>
                    <div class="info-card-content">
                        <p><strong>Hardware:</strong> ${agent.hardware_count || 'No disponible'} elementos</p>
                        <p><strong>Software:</strong> ${agent.software_count || 'No disponible'} elementos</p>
                        <p><strong>Último inventario:</strong> ${agent.last_inventory_date ? ApiUtils.formatDate(agent.last_inventory_date) : 'No disponible'}</p>
                    </div>
                </div>

                ${ramInfoHtml}

                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="agentsManager.refreshAgentData(${agent.agent_id})">
                        🔄 Actualizar Datos
                    </button>
                    <button class="btn btn-secondary" onclick="agentsManager.exportAgentData(${agent.agent_id})">
                        📋 Exportar Datos
                    </button>
                </div>
            </div>
        `;
    }

    // Refresh agent data
    async refreshAgentData(agentId) {
        try {
            ApiUtils.showNotification('Actualizando datos del agente...', 'info');
            await this.showAgentDetails(agentId);
            ApiUtils.showNotification('Datos del agente actualizados', 'success');
        } catch (error) {
            ApiUtils.handleError(error, 'Refreshing agent data');
        }
    }

    // Export agent data
    exportAgentData(agentId) {
        try {
            const agent = this.agents.find(a => a.agent_id === agentId);
            if (!agent) {
                throw new Error('Agent not found');
            }

            const exportData = {
                timestamp: new Date().toISOString(),
                agent_data: agent,
                export_type: 'agent_details'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `agent-${agent.pc_name}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            ApiUtils.showNotification('Datos del agente exportados', 'success');
        } catch (error) {
            ApiUtils.handleError(error, 'Exporting agent data');
        }
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }
}

// Global agents manager instance
window.agentsManager = new AgentsManager();

// Global functions accessible from HTML
window.loadAgents = () => {
    agentsManager.loadAgents();
};

window.closeModal = () => {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
};

// Auto-initialize when needed
document.addEventListener('DOMContentLoaded', () => {
    // Will be initialized when agents tab is first shown
}); 