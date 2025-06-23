class LocationsManager {
    constructor() {
        this.locations = [];
        this.locationStats = [];
        this.locationHistory = [];
    }

    async init() {
        console.log('📍 Initializing Locations Manager...');
        await this.loadLocationsData();
    }

    async loadLocationsData() {
        try {
            ApiUtils.showLoading('locationsContainer');
            ApiUtils.showLoading('locationStatsContainer');
            
            const [locationsResponse, statsResponse] = await Promise.all([
                sbdApi.getLocations(),
                sbdApi.getLocationStatistics()
            ]);

            if (locationsResponse.success) {
                this.locations = locationsResponse.data;
                this.renderLocations();
            }

            if (statsResponse.success) {
                this.locationStats = statsResponse.data;
                this.renderLocationStats();
            }

        } catch (error) {
            ApiUtils.handleError(error, 'Loading locations data');
            document.getElementById('locationsContainer').innerHTML = 
                '<div class="alert alert-error">Error cargando ubicaciones</div>';
        }
    }

    renderLocations() {
        const container = document.getElementById('locationsContainer');
        if (!container) return;

        if (this.locations.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay ubicaciones disponibles</div>';
            return;
        }

        const locationsHtml = this.locations.map(location => `
            <div class="list-group-item">
                <h4>📍 ${location.name}</h4>
                <p><strong>Subnet:</strong> ${location.subnet}</p>
                <p><strong>ID:</strong> ${location.id}</p>
                ${location.parent_location_id ? `<p><strong>Ubicación padre:</strong> ID ${location.parent_location_id}</p>` : '<p><em>Ubicación raíz</em></p>'}
            </div>
        `).join('');

        container.innerHTML = `
            <div class="locations-summary">
                <p>Total de ubicaciones: ${this.locations.length}</p>
            </div>
            <div class="list-group">
                ${locationsHtml}
            </div>
        `;
    }

    renderLocationStats() {
        const container = document.getElementById('locationStatsContainer');
        if (!container) return;

        if (this.locationStats.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay estadísticas disponibles</div>';
            return;
        }

        const statsHtml = this.locationStats.map(stat => `
            <div class="card">
                <h4>📊 ${stat.location_name}</h4>
                <div class="location-stats">
                    <p><strong>Subnet:</strong> ${stat.subnet}</p>
                    <p><strong>Agentes actuales:</strong> ${stat.current_agents}</p>
                    <p><strong>Hardware:</strong> ${stat.hardware_items}</p>
                    <p><strong>Software:</strong> ${stat.software_items}</p>
                    <p><strong>Motherboards:</strong> ${stat.motherboards_count}</p>
                    <p><strong>Procesadores:</strong> ${stat.processors_count}</p>
                    <p><strong>Módulos RAM:</strong> ${stat.ram_modules_count}</p>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="stats-summary">
                <p>Estadísticas de ${this.locationStats.length} ubicaciones</p>
            </div>
            <div class="locations-stats-grid">
                ${statsHtml}
            </div>
        `;
    }

    async loadLocationHistory() {
        try {
            const response = await sbdApi.getLocationHistory();
            
            if (response.success) {
                this.locationHistory = response.data;
                return response.data;
            }
            
            return [];
        } catch (error) {
            ApiUtils.handleError(error, 'Loading location history');
            return [];
        }
    }

    exportLocationsData() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                locations: this.locations,
                location_statistics: this.locationStats,
                total_locations: this.locations.length,
                export_type: 'locations_data'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `locations-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            ApiUtils.showNotification('Datos de ubicaciones exportados', 'success');
        } catch (error) {
            ApiUtils.handleError(error, 'Exporting locations data');
        }
    }
}

window.locationsManager = new LocationsManager();

window.loadLocations = () => {
    locationsManager.loadLocationsData();
}; 