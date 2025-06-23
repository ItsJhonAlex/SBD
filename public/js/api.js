class SBDApi {
    constructor() {
        this.baseUrl = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // Generic HTTP request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ========== AGENTS API ==========
    
    // Get all agents
    async getAgents() {
        return this.get('/agents');
    }

    // Search agents
    async searchAgents(term) {
        return this.get(`/agents/search/${encodeURIComponent(term)}`);
    }

    // Get agent details
    async getAgentDetails(agentId) {
        return this.get(`/agents/${agentId}/details`);
    }

    // Get agent RAM information
    async getAgentRam(agentId) {
        return this.get(`/agents/${agentId}/ram`);
    }

    // Move agent to location
    async moveAgent(agentId, locationId) {
        return this.post(`/agents/${agentId}/move`, { location_id: locationId });
    }

    // ========== INVENTORY API ==========
    
    // Get inventory summary
    async getInventorySummary() {
        return this.get('/inventory/summary');
    }

    // Get hardware inventory
    async getHardwareInventory() {
        return this.get('/inventory/hardware');
    }

    // Get software inventory
    async getSoftwareInventory() {
        return this.get('/inventory/software');
    }

    // Get motherboard configurations
    async getMotherboards() {
        return this.get('/inventory/motherboards');
    }

    // Get RAM analysis
    async getRamAnalysis() {
        return this.get('/inventory/ram-analysis');
    }

    // ========== LOCATIONS API ==========
    
    // Get all locations
    async getLocations() {
        return this.get('/locations');
    }

    // Get location statistics
    async getLocationStatistics() {
        return this.get('/locations/statistics');
    }

    // Get location history
    async getLocationHistory() {
        return this.get('/locations/history');
    }

    // ========== STATISTICS API ==========
    
    // Get system statistics
    async getSystemStatistics() {
        return this.get('/statistics');
    }

    // Search equipment
    async searchEquipment(term) {
        return this.get(`/statistics/search/${encodeURIComponent(term)}`);
    }
}

// Create global API instance
window.sbdApi = new SBDApi();

// Utility functions for API responses
window.ApiUtils = {
    // Handle API errors gracefully
    handleError(error, context = 'Operation') {
        console.error(`${context} failed:`, error);
        
        // Show user-friendly error message
        this.showNotification(`Error: ${error.message}`, 'error');
        
        return null;
    },

    // Show loading state
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="loading">Cargando datos...</div>';
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '1001';
        notification.style.minWidth = '300px';
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    },

    // Format data for display
    formatData(data) {
        if (!data) return 'N/A';
        if (typeof data === 'string') return data;
        if (typeof data === 'number') return data.toLocaleString();
        if (typeof data === 'object') return JSON.stringify(data, null, 2);
        return String(data);
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('es-ES');
        } catch (error) {
            return dateString;
        }
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}; 