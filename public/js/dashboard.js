class Dashboard {
    constructor() {
        this.systemStats = null;
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.refreshIntervalMs = 30000; // 30 seconds
    }

    // Initialize dashboard
    async init() {
        console.log('🚀 Initializing Dashboard...');
        await this.loadSystemStatistics();
        await this.loadRecentActivity();
        this.setupAutoRefresh();
    }

    // Load system statistics
    async loadSystemStatistics() {
        try {
            ApiUtils.showLoading('systemStats');
            
            const response = await sbdApi.getSystemStatistics();
            
            if (response.success && response.data) {
                this.systemStats = response.data;
                this.renderSystemStats(response.data);
            } else {
                throw new Error('No statistics data received');
            }
        } catch (error) {
            ApiUtils.handleError(error, 'Loading system statistics');
            document.getElementById('systemStats').innerHTML = 
                '<div class="alert alert-error">Error cargando estadísticas del sistema</div>';
        }
    }

    // Render system statistics
    renderSystemStats(stats) {
        const container = document.getElementById('systemStats');
        if (!container) return;

        const statsHtml = stats.map(stat => `
            <div class="stat-item">
                <span class="stat-number">${stat.stat_value}</span>
                <span class="stat-label">${this.translateStatName(stat.stat_name)}</span>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="stats-grid">
                ${statsHtml}
            </div>
        `;
    }

    // Translate stat names to Spanish
    translateStatName(statName) {
        const translations = {
            'Total Agents': 'Agentes Totales',
            'Total Locations': 'Ubicaciones Totales',
            'Total Inventories': 'Inventarios Totales',
            'Hardware Inventories': 'Inventarios Hardware',
            'Software Inventories': 'Inventarios Software',
            'Total Motherboards': 'Motherboards Totales',
            'Total Processors': 'Procesadores Totales',
            'Total RAM Modules': 'Módulos RAM Totales'
        };
        return translations[statName] || statName;
    }

    // Load recent activity (simulated for now)
    async loadRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        try {
            // For now, we'll show simulated recent activity
            // In a real implementation, this would come from an API endpoint
            const activities = [
                {
                    icon: '🖥️',
                    title: 'Nuevo agente conectado: LAB-REDES-PC03',
                    time: '5 minutos atrás'
                },
                {
                    icon: '📦',
                    title: 'Inventario actualizado: SERVER-WEB-01',
                    time: '15 minutos atrás'
                },
                {
                    icon: '📍',
                    title: 'Agente movido a nueva ubicación',
                    time: '30 minutos atrás'
                },
                {
                    icon: '🔧',
                    title: 'Mantenimiento completado: Laboratorio de Programación',
                    time: '1 hora atrás'
                },
                {
                    icon: '📊',
                    title: 'Reporte de análisis RAM generado',
                    time: '2 horas atrás'
                }
            ];

            const activitiesHtml = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = activitiesHtml;
        } catch (error) {
            ApiUtils.handleError(error, 'Loading recent activity');
            container.innerHTML = '<div class="alert alert-error">Error cargando actividad reciente</div>';
        }
    }

    // Setup auto refresh
    setupAutoRefresh() {
        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                this.refreshData();
            }, this.refreshIntervalMs);
        }
    }

    // Refresh dashboard data
    async refreshData() {
        console.log('🔄 Refreshing dashboard data...');
        ApiUtils.showNotification('Actualizando datos del dashboard...', 'info');
        
        try {
            await Promise.all([
                this.loadSystemStatistics(),
                this.loadRecentActivity()
            ]);
            
            ApiUtils.showNotification('Dashboard actualizado correctamente', 'success');
        } catch (error) {
            ApiUtils.handleError(error, 'Refreshing dashboard');
        }
    }

    // Export dashboard data
    exportData() {
        try {
            if (!this.systemStats) {
                ApiUtils.showNotification('No hay datos para exportar', 'warning');
                return;
            }

            const exportData = {
                timestamp: new Date().toISOString(),
                system_statistics: this.systemStats,
                export_type: 'dashboard_summary'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `sbd-dashboard-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            ApiUtils.showNotification('Datos exportados correctamente', 'success');
        } catch (error) {
            ApiUtils.handleError(error, 'Exporting data');
        }
    }

    // Toggle auto refresh
    toggleAutoRefresh() {
        this.autoRefreshEnabled = !this.autoRefreshEnabled;
        
        if (this.autoRefreshEnabled) {
            this.setupAutoRefresh();
            ApiUtils.showNotification('Auto-actualización activada', 'success');
        } else {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
            ApiUtils.showNotification('Auto-actualización desactivada', 'warning');
        }
    }

    // Cleanup
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Global dashboard instance
window.dashboard = new Dashboard();

// Global functions accessible from HTML
window.refreshData = () => {
    dashboard.refreshData();
};

window.exportData = () => {
    dashboard.exportData();
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dashboard.init();
}); 