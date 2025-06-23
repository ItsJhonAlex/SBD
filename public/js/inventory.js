class InventoryManager {
    constructor() {
        this.currentInventoryType = 'all';
        this.inventoryData = {
            summary: [],
            hardware: [],
            software: [],
            motherboards: []
        };
    }

    // Initialize inventory management
    async init() {
        console.log('📦 Initializing Inventory Manager...');
        await this.loadInventoryData();
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        const typeSelect = document.getElementById('inventoryType');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.currentInventoryType = e.target.value;
                this.renderCurrentInventory();
            });
        }
    }

    // Load all inventory data
    async loadInventoryData() {
        try {
            ApiUtils.showLoading('inventoryContainer');
            
            const responses = await Promise.all([
                sbdApi.getInventorySummary(),
                sbdApi.getHardwareInventory(),
                sbdApi.getSoftwareInventory(),
                sbdApi.getMotherboards()
            ]);

            if (responses[0].success) this.inventoryData.summary = responses[0].data;
            if (responses[1].success) this.inventoryData.hardware = responses[1].data;
            if (responses[2].success) this.inventoryData.software = responses[2].data;
            if (responses[3].success) this.inventoryData.motherboards = responses[3].data;

            this.renderCurrentInventory();
        } catch (error) {
            ApiUtils.handleError(error, 'Loading inventory data');
            document.getElementById('inventoryContainer').innerHTML = 
                '<div class="alert alert-error">Error cargando datos de inventario</div>';
        }
    }

    // Render current inventory based on selected type
    renderCurrentInventory() {
        switch (this.currentInventoryType) {
            case 'all':
                this.renderAllInventory();
                break;
            case 'hardware':
                this.renderHardwareInventory();
                break;
            case 'software':
                this.renderSoftwareInventory();
                break;
            case 'motherboards':
                this.renderMotherboardsInventory();
                break;
            default:
                this.renderAllInventory();
        }
    }

    // Render all inventory summary
    renderAllInventory() {
        const container = document.getElementById('inventoryContainer');
        if (!container) return;

        if (this.inventoryData.summary.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay datos de inventario disponibles</div>';
            return;
        }

        const summaryHtml = this.inventoryData.summary.map(item => `
            <div class="card">
                <h4>🖥️ ${item.pc_name}</h4>
                <p><strong>Hardware:</strong> ${item.hardware_count}</p>
                <p><strong>Software:</strong> ${item.software_count}</p>
                <p><strong>Total:</strong> ${item.total_inventories}</p>
                <p><strong>Último inventario:</strong> ${ApiUtils.formatDate(item.last_inventory_date)}</p>
            </div>
        `).join('');

        container.innerHTML = `
            <h3>📊 Resumen de Inventarios</h3>
            <div class="inventory-grid">${summaryHtml}</div>
        `;
    }

    // Render hardware inventory
    renderHardwareInventory() {
        const container = document.getElementById('inventoryContainer');
        if (!container) return;

        const hardwareHtml = this.inventoryData.hardware.map(item => `
            <tr>
                <td>${item.agent_name}</td>
                <td>${item.model}</td>
                <td>${item.supplier_name}</td>
                <td>${item.serial_number}</td>
                <td>${ApiUtils.formatDate(item.inventory_date)}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <h3>🔧 Inventario de Hardware</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Agente</th>
                        <th>Modelo</th>
                        <th>Proveedor</th>
                        <th>Serie</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>${hardwareHtml}</tbody>
            </table>
        `;
    }

    // Render software inventory
    renderSoftwareInventory() {
        const container = document.getElementById('inventoryContainer');
        if (!container) return;

        const softwareHtml = this.inventoryData.software.map(item => `
            <tr>
                <td>${item.pc_name}</td>
                <td>${item.software_name}</td>
                <td>${item.software_type}</td>
                <td>${ApiUtils.formatDate(item.install_date)}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <h3>💻 Inventario de Software</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>PC</th>
                        <th>Software</th>
                        <th>Tipo</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>${softwareHtml}</tbody>
            </table>
        `;
    }

    // Render motherboards inventory
    renderMotherboardsInventory() {
        const container = document.getElementById('inventoryContainer');
        if (!container) return;

        const motherboardsHtml = this.inventoryData.motherboards.map(mb => `
            <div class="card">
                <h4>🔌 ${mb.motherboard_name}</h4>
                <p><strong>Agente:</strong> ${mb.agent_name}</p>
                <p><strong>Procesador:</strong> ${mb.processor_family}</p>
                <p><strong>RAM Slots:</strong> ${mb.ram_slots_used}/4</p>
            </div>
        `).join('');

        container.innerHTML = `
            <h3>🔌 Motherboards</h3>
            <div class="inventory-grid">${motherboardsHtml}</div>
        `;
    }

    // Load RAM analysis for analysis tab
    async loadRamAnalysis() {
        try {
            const response = await sbdApi.getRamAnalysis();
            
            if (response.success && response.data) {
                this.inventoryData.ramAnalysis = response.data;
                return response.data;
            }
            
            return [];
        } catch (error) {
            ApiUtils.handleError(error, 'Loading RAM analysis');
            return [];
        }
    }

    // Export inventory data
    exportInventoryData() {
        try {
            const exportData = {
                timestamp: new Date().toISOString(),
                inventory_type: this.currentInventoryType,
                data: this.inventoryData[this.currentInventoryType === 'all' ? 'summary' : this.currentInventoryType],
                total_records: this.inventoryData[this.currentInventoryType === 'all' ? 'summary' : this.currentInventoryType].length,
                export_type: 'inventory_data'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `inventory-${this.currentInventoryType}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            ApiUtils.showNotification('Datos de inventario exportados', 'success');
        } catch (error) {
            ApiUtils.handleError(error, 'Exporting inventory data');
        }
    }
}

// Global inventory manager instance
window.inventoryManager = new InventoryManager();

// Global functions accessible from HTML
window.loadInventory = () => {
    inventoryManager.loadInventoryData();
};

// Auto-initialize when needed
document.addEventListener('DOMContentLoaded', () => {
    // Will be initialized when inventory tab is first shown
}); 