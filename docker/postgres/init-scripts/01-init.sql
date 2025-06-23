-- TABLA: Locations (Ubicaciones jerárquicas)
CREATE TABLE locations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    subnet TEXT NOT NULL,
    parent_location_id BIGINT
);

-- TABLA: Agents (Computadoras en la red)
CREATE TABLE agents (
    id BIGSERIAL PRIMARY KEY,
    basic_media_number TEXT NOT NULL,
    operating_systems TEXT NOT NULL,
    pc_name TEXT NOT NULL,
    ip_part1 INTEGER,
    ip_part2 INTEGER,
    ip_part3 INTEGER,
    ip_part4 INTEGER
);

-- TABLA: Agent_Locations (Historial de ubicaciones)
CREATE TABLE agent_locations (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT,
    location_id BIGINT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE
);

-- TABLA: Inventories (Inventarios base)
CREATE TABLE inventories (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type TEXT NOT NULL,
    agent_id BIGINT,
    parent_inventory_id BIGINT
);

-- TABLA: Hardware_Inventories (Detalles de hardware)
CREATE TABLE hardware_inventories (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT,
    serial_number TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    model TEXT NOT NULL
);

-- TABLA: Software_Inventories (Detalles de software)
CREATE TABLE software_inventories (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT,
    software_name TEXT NOT NULL,
    software_type TEXT NOT NULL
);

-- TABLA: Motherboards (Tarjetas madre)
CREATE TABLE motherboards (
    id BIGSERIAL PRIMARY KEY,
    hardware_inventory_id BIGINT,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    capacity TEXT NOT NULL
);

-- TABLA: Processors (Procesadores)
CREATE TABLE processors (
    id BIGSERIAL PRIMARY KEY,
    motherboard_id BIGINT,
    family TEXT NOT NULL,
    speed TEXT NOT NULL,
    version TEXT NOT NULL,
    voltage TEXT NOT NULL
);

-- TABLA: RAM_Memories (Memorias RAM)
CREATE TABLE ram_memories (
    id BIGSERIAL PRIMARY KEY,
    motherboard_id BIGINT,
    slot_number INTEGER NOT NULL,
    type TEXT NOT NULL,
    dimension TEXT NOT NULL,
    data_width TEXT NOT NULL
);

-- TABLA: Storage_Devices (Dispositivos de almacenamiento)
CREATE TABLE storage_devices (
    id BIGSERIAL PRIMARY KEY,
    hardware_inventory_id BIGINT,
    communication_interface TEXT NOT NULL,
    capacity TEXT NOT NULL
);

-- TABLA: IO_Devices (Dispositivos de entrada/salida)
CREATE TABLE io_devices (
    id BIGSERIAL PRIMARY KEY,
    hardware_inventory_id BIGINT,
    type TEXT NOT NULL,
    interface TEXT NOT NULL,
    family TEXT NOT NULL
);

-- SECCIÓN 2: FUNCIONES Y PROCEDIMIENTOS

-- FUNCIÓN: Obtener dirección IP completa de un agente
CREATE OR REPLACE FUNCTION get_agent_ip(agent_id_param BIGINT)
RETURNS TEXT AS $$
DECLARE
    ip_address TEXT;
BEGIN
    SELECT CONCAT(ip_part1, '.', ip_part2, '.', ip_part3, '.', ip_part4)
    INTO ip_address
    FROM agents
    WHERE id = agent_id_param;
    
    RETURN COALESCE(ip_address, 'No IP configured');
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Obtener ubicación actual de un agente
CREATE OR REPLACE FUNCTION get_agent_current_location(agent_id_param BIGINT)
RETURNS TABLE(location_name TEXT, location_subnet TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT l.name, l.subnet
    FROM agent_locations al
    JOIN locations l ON al.location_id = l.id
    WHERE al.agent_id = agent_id_param 
    AND al.end_time IS NULL
    ORDER BY al.start_time DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Contar hardware por tipo en un agente
CREATE OR REPLACE FUNCTION count_hardware_by_type(agent_id_param BIGINT)
RETURNS TABLE(hardware_type TEXT, hardware_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH hardware_types AS (
        SELECT 'Motherboard' as type, COUNT(*) as count
        FROM inventories i
        JOIN hardware_inventories hi ON i.id = hi.inventory_id
        JOIN motherboards m ON hi.id = m.hardware_inventory_id
        WHERE i.agent_id = agent_id_param
        
        UNION ALL
        
        SELECT 'Storage Device' as type, COUNT(*) as count
        FROM inventories i
        JOIN hardware_inventories hi ON i.id = hi.inventory_id
        JOIN storage_devices sd ON hi.id = sd.hardware_inventory_id
        WHERE i.agent_id = agent_id_param
        
        UNION ALL
        
        SELECT 'I/O Device' as type, COUNT(*) as count
        FROM inventories i
        JOIN hardware_inventories hi ON i.id = hi.inventory_id
        JOIN io_devices io ON hi.id = io.hardware_inventory_id
        WHERE i.agent_id = agent_id_param
    )
    SELECT ht.type, ht.count FROM hardware_types ht WHERE ht.count > 0;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Obtener información completa de RAM de un agente
CREATE OR REPLACE FUNCTION get_agent_ram_info(agent_id_param BIGINT)
RETURNS TABLE(
    slot_number INTEGER,
    ram_type TEXT,
    ram_dimension TEXT,
    data_width TEXT,
    motherboard_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rm.slot_number,
        rm.type,
        rm.dimension,
        rm.data_width,
        mb.name
    FROM inventories i
    JOIN hardware_inventories hi ON i.id = hi.inventory_id
    JOIN motherboards mb ON hi.id = mb.hardware_inventory_id
    JOIN ram_memories rm ON mb.id = rm.motherboard_id
    WHERE i.agent_id = agent_id_param
    ORDER BY mb.name, rm.slot_number;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Estadísticas generales del sistema
CREATE OR REPLACE FUNCTION get_system_statistics()
RETURNS TABLE(
    stat_name TEXT,
    stat_value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Total Agents'::TEXT, COUNT(*)::BIGINT FROM agents
    UNION ALL
    SELECT 'Total Locations'::TEXT, COUNT(*)::BIGINT FROM locations
    UNION ALL
    SELECT 'Total Inventories'::TEXT, COUNT(*)::BIGINT FROM inventories
    UNION ALL
    SELECT 'Hardware Inventories'::TEXT, COUNT(*)::BIGINT FROM hardware_inventories
    UNION ALL
    SELECT 'Software Inventories'::TEXT, COUNT(*)::BIGINT FROM software_inventories
    UNION ALL
    SELECT 'Total Motherboards'::TEXT, COUNT(*)::BIGINT FROM motherboards
    UNION ALL
    SELECT 'Total Processors'::TEXT, COUNT(*)::BIGINT FROM processors
    UNION ALL
    SELECT 'Total RAM Modules'::TEXT, COUNT(*)::BIGINT FROM ram_memories;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Buscar agentes por criterio
CREATE OR REPLACE FUNCTION search_agents(search_term TEXT)
RETURNS TABLE(
    agent_id BIGINT,
    pc_name TEXT,
    operating_system TEXT,
    ip_address TEXT,
    current_location TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.pc_name,
        a.operating_systems,
        get_agent_ip(a.id),
        COALESCE(
            (SELECT l.name 
             FROM agent_locations al 
             JOIN locations l ON al.location_id = l.id 
             WHERE al.agent_id = a.id AND al.end_time IS NULL 
             LIMIT 1), 
            'No location assigned'
        )
    FROM agents a
    WHERE 
        LOWER(a.pc_name) LIKE LOWER('%' || search_term || '%') OR
        LOWER(a.operating_systems) LIKE LOWER('%' || search_term || '%') OR
        a.basic_media_number LIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Validar slots de RAM disponibles en una motherboard
CREATE OR REPLACE FUNCTION get_available_ram_slots(motherboard_id_param BIGINT)
RETURNS INTEGER[] AS $$
DECLARE
    used_slots INTEGER[];
    all_slots INTEGER[] := ARRAY[1, 2, 3, 4];
    available_slots INTEGER[];
BEGIN
    SELECT ARRAY(
        SELECT slot_number 
        FROM ram_memories 
        WHERE motherboard_id = motherboard_id_param
    ) INTO used_slots;
    
    SELECT ARRAY(
        SELECT unnest(all_slots)
        EXCEPT
        SELECT unnest(COALESCE(used_slots, ARRAY[]::INTEGER[]))
    ) INTO available_slots;
    
    RETURN available_slots;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Mover agente a nueva ubicación
CREATE OR REPLACE FUNCTION move_agent_to_location(
    agent_id_param BIGINT,
    new_location_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_location_record RECORD;
BEGIN
    UPDATE agent_locations 
    SET end_time = CURRENT_TIMESTAMP
    WHERE agent_id = agent_id_param 
    AND end_time IS NULL;
    
    INSERT INTO agent_locations (agent_id, location_id, start_time)
    VALUES (agent_id_param, new_location_id, CURRENT_TIMESTAMP);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Obtener información completa de un agente
CREATE OR REPLACE FUNCTION get_agent_complete_info(agent_id_param BIGINT)
RETURNS TABLE(
    agent_name TEXT,
    ip_address TEXT,
    operating_system TEXT,
    current_location TEXT,
    hardware_count BIGINT,
    software_count BIGINT,
    last_inventory_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.pc_name,
        get_agent_ip(a.id),
        a.operating_systems,
        COALESCE(
            (SELECT l.name 
             FROM agent_locations al 
             JOIN locations l ON al.location_id = l.id 
             WHERE al.agent_id = a.id AND al.end_time IS NULL 
             LIMIT 1), 
            'No location assigned'
        ),
        (SELECT COUNT(*) FROM inventories WHERE agent_id = a.id AND type = 'hardware'),
        (SELECT COUNT(*) FROM inventories WHERE agent_id = a.id AND type = 'software'),
        (SELECT MAX(date) FROM inventories WHERE agent_id = a.id)
    FROM agents a
    WHERE a.id = agent_id_param;
END;
$$ LANGUAGE plpgsql;

--  SECCIÓN 3: VISTAS DEL SISTEMA

--  VISTA: Agentes con su ubicación actual y dirección IP
CREATE OR REPLACE VIEW v_agents_with_location AS
SELECT 
    a.id as agent_id,
    a.pc_name,
    a.operating_systems,
    a.basic_media_number,
    CONCAT(a.ip_part1, '.', a.ip_part2, '.', a.ip_part3, '.', a.ip_part4) as ip_address,
    l.name as current_location,
    l.subnet as location_subnet,
    al.start_time as location_since
FROM agents a
LEFT JOIN agent_locations al ON a.id = al.agent_id AND al.end_time IS NULL
LEFT JOIN locations l ON al.location_id = l.id;

--  VISTA: Resumen de inventarios por agente
CREATE OR REPLACE VIEW v_inventory_summary_by_agent AS
SELECT 
    a.id as agent_id,
    a.pc_name,
    COUNT(CASE WHEN i.type = 'hardware' THEN 1 END) as hardware_count,
    COUNT(CASE WHEN i.type = 'software' THEN 1 END) as software_count,
    COUNT(i.id) as total_inventories,
    MAX(i.date) as last_inventory_date,
    MIN(i.date) as first_inventory_date
FROM agents a
LEFT JOIN inventories i ON a.id = i.agent_id
GROUP BY a.id, a.pc_name;

--  VISTA: Hardware completo con especificaciones
CREATE OR REPLACE VIEW v_hardware_complete AS
SELECT 
    i.id as inventory_id,
    i.code as inventory_code,
    i.date as inventory_date,
    a.pc_name as agent_name,
    hi.serial_number,
    hi.supplier_name,
    hi.model,
    mb.name as motherboard_name,
    mb.version as motherboard_version,
    p.family as processor_family,
    p.speed as processor_speed,
    COUNT(rm.id) as ram_modules_count,
    STRING_AGG(DISTINCT rm.type || ' ' || rm.dimension, ', ') as ram_details,
    COUNT(DISTINCT sd.id) as storage_devices_count,
    COUNT(DISTINCT io.id) as io_devices_count
FROM inventories i
JOIN hardware_inventories hi ON i.id = hi.inventory_id
JOIN agents a ON i.agent_id = a.id
LEFT JOIN motherboards mb ON hi.id = mb.hardware_inventory_id
LEFT JOIN processors p ON mb.id = p.motherboard_id
LEFT JOIN ram_memories rm ON mb.id = rm.motherboard_id
LEFT JOIN storage_devices sd ON hi.id = sd.hardware_inventory_id
LEFT JOIN io_devices io ON hi.id = io.hardware_inventory_id
WHERE i.type = 'hardware'
GROUP BY i.id, i.code, i.date, a.pc_name, hi.serial_number, hi.supplier_name, 
         hi.model, mb.name, mb.version, p.family, p.speed;

--  VISTA: Software instalado por agente
CREATE OR REPLACE VIEW v_software_by_agent AS
SELECT 
    a.id as agent_id,
    a.pc_name,
    a.operating_systems,
    i.code as inventory_code,
    i.date as install_date,
    si.software_name,
    si.software_type
FROM agents a
JOIN inventories i ON a.id = i.agent_id
JOIN software_inventories si ON i.id = si.inventory_id
WHERE i.type = 'software'
ORDER BY a.pc_name, si.software_type, si.software_name;

--  VISTA: Configuración de motherboards con componentes
CREATE OR REPLACE VIEW v_motherboard_configuration AS
SELECT 
    mb.id as motherboard_id,
    a.pc_name as agent_name,
    hi.serial_number as hardware_serial,
    mb.name as motherboard_name,
    mb.version as motherboard_version,
    p.family as processor_family,
    p.speed as processor_speed,
    p.voltage as processor_voltage,
    COUNT(rm.id) as ram_slots_used,
    STRING_AGG(
        'Slot ' || rm.slot_number || ': ' || rm.type || ' ' || rm.dimension || ' (' || rm.data_width || ')', 
        E'\n' ORDER BY rm.slot_number
    ) as ram_configuration
FROM motherboards mb
JOIN hardware_inventories hi ON mb.hardware_inventory_id = hi.id
JOIN inventories i ON hi.inventory_id = i.id
JOIN agents a ON i.agent_id = a.id
LEFT JOIN processors p ON mb.id = p.motherboard_id
LEFT JOIN ram_memories rm ON mb.id = rm.motherboard_id
GROUP BY mb.id, a.pc_name, hi.serial_number, mb.name, mb.version, 
         p.family, p.speed, p.voltage;

--  VISTA: Historial completo de ubicaciones
CREATE OR REPLACE VIEW v_location_history AS
SELECT 
    a.id as agent_id,
    a.pc_name,
    l.name as location_name,
    l.subnet as location_subnet,
    al.start_time,
    al.end_time,
    CASE 
        WHEN al.end_time IS NULL THEN 'CURRENT'
        ELSE 'HISTORICAL'
    END as status,
    CASE 
        WHEN al.end_time IS NULL THEN NULL
        ELSE al.end_time - al.start_time
    END as duration
FROM agent_locations al
JOIN agents a ON al.agent_id = a.id
JOIN locations l ON al.location_id = l.id
ORDER BY a.pc_name, al.start_time DESC;

--  VISTA: Búsqueda rápida de equipos
CREATE OR REPLACE VIEW v_equipment_search AS
SELECT 
    'AGENT' as item_type,
    a.id as item_id,
    a.pc_name as name,
    a.operating_systems as description,
    CONCAT(a.ip_part1, '.', a.ip_part2, '.', a.ip_part3, '.', a.ip_part4) as identifier,
    l.name as location
FROM agents a
LEFT JOIN agent_locations al ON a.id = al.agent_id AND al.end_time IS NULL
LEFT JOIN locations l ON al.location_id = l.id

UNION ALL

SELECT 
    'HARDWARE' as item_type,
    hi.id as item_id,
    hi.model as name,
    hi.supplier_name as description,
    hi.serial_number as identifier,
    l.name as location
FROM hardware_inventories hi
JOIN inventories i ON hi.inventory_id = i.id
LEFT JOIN agents a ON i.agent_id = a.id
LEFT JOIN agent_locations al ON a.id = al.agent_id AND al.end_time IS NULL
LEFT JOIN locations l ON al.location_id = l.id

UNION ALL

SELECT 
    'SOFTWARE' as item_type,
    si.id as item_id,
    si.software_name as name,
    si.software_type as description,
    i.code as identifier,
    l.name as location
FROM software_inventories si
JOIN inventories i ON si.inventory_id = i.id
LEFT JOIN agents a ON i.agent_id = a.id
LEFT JOIN agent_locations al ON a.id = al.agent_id AND al.end_time IS NULL
LEFT JOIN locations l ON al.location_id = l.id;

--  VISTA: Estadísticas por ubicación
CREATE OR REPLACE VIEW v_location_statistics AS
SELECT 
    l.id as location_id,
    l.name as location_name,
    l.subnet,
    COUNT(DISTINCT al.agent_id) as current_agents,
    COUNT(DISTINCT i.id) FILTER (WHERE i.type = 'hardware') as hardware_items,
    COUNT(DISTINCT i.id) FILTER (WHERE i.type = 'software') as software_items,
    COUNT(DISTINCT hi.id) as unique_hardware_pieces,
    COUNT(DISTINCT mb.id) as motherboards_count,
    COUNT(DISTINCT p.id) as processors_count,
    COUNT(DISTINCT rm.id) as ram_modules_count
FROM locations l
LEFT JOIN agent_locations al ON l.id = al.location_id AND al.end_time IS NULL
LEFT JOIN inventories i ON al.agent_id = i.agent_id
LEFT JOIN hardware_inventories hi ON i.id = hi.inventory_id AND i.type = 'hardware'
LEFT JOIN motherboards mb ON hi.id = mb.hardware_inventory_id
LEFT JOIN processors p ON mb.id = p.motherboard_id
LEFT JOIN ram_memories rm ON mb.id = rm.motherboard_id
GROUP BY l.id, l.name, l.subnet;

--  VISTA: Análisis de memoria RAM
CREATE OR REPLACE VIEW v_ram_analysis AS
SELECT 
    a.pc_name as agent_name,
    mb.name as motherboard_name,
    COUNT(rm.id) as slots_used,
    4 - COUNT(rm.id) as slots_available,
    ROUND((COUNT(rm.id)::DECIMAL / 4) * 100, 2) as usage_percentage,
    STRING_AGG(rm.type, ', ') as ram_types,
    STRING_AGG(rm.dimension, ', ') as ram_sizes,
    SUM(CASE 
        WHEN rm.dimension LIKE '%GB%' THEN 
            CAST(REGEXP_REPLACE(rm.dimension, '[^0-9]', '', 'g') AS INTEGER)
        ELSE 0 
    END) as total_gb_estimated
FROM motherboards mb
JOIN hardware_inventories hi ON mb.hardware_inventory_id = hi.id
JOIN inventories i ON hi.inventory_id = i.id
JOIN agents a ON i.agent_id = a.id
LEFT JOIN ram_memories rm ON mb.id = rm.motherboard_id
GROUP BY a.pc_name, mb.name, mb.id;

--  SECCIÓN 4: DATOS DE EJEMPLO

--  INSERTAR DATOS: Locations (Ubicaciones jerárquicas - orden correcto)
-- Primero la ubicación raíz (sin parent)
INSERT INTO locations (name, subnet, parent_location_id) VALUES
('Universidad de las Ciencias Informáticas', '192.168.0.0/16', NULL);

-- Luego las ubicaciones de primer nivel (hijas de UCI)
INSERT INTO locations (name, subnet, parent_location_id) VALUES
('Facultad de Ingeniería', '192.168.1.0/24', 1),
('Oficinas Administrativas', '192.168.2.0/24', 1),
('Biblioteca Digital', '192.168.3.0/24', 1);

-- Finalmente las ubicaciones de segundo nivel (hijas de Facultad de Ingeniería)
INSERT INTO locations (name, subnet, parent_location_id) VALUES
('Laboratorio de Redes', '192.168.1.0/26', 2),
('Laboratorio de Programación', '192.168.1.64/26', 2),
('Sala de Servidores', '192.168.1.128/26', 2);

--  INSERTAR DATOS: Agents (Agentes/Computadoras)
INSERT INTO agents (basic_media_number, operating_systems, pc_name, ip_part1, ip_part2, ip_part3, ip_part4) VALUES
('BM001-UCI-2024', 'Windows 11 Pro', 'LAB-REDES-PC01', 192, 168, 1, 10),
('BM002-UCI-2024', 'Ubuntu 22.04 LTS', 'LAB-REDES-PC02', 192, 168, 1, 11),
('BM003-UCI-2024', 'Windows 10 Pro', 'LAB-PROG-PC01', 192, 168, 1, 70),
('BM004-UCI-2024', 'Windows 11 Pro', 'LAB-PROG-PC02', 192, 168, 1, 71),
('BM005-UCI-2024', 'CentOS 8', 'SERVER-WEB-01', 192, 168, 1, 130),
('BM006-UCI-2024', 'Ubuntu Server 22.04', 'SERVER-DB-01', 192, 168, 1, 131),
('BM007-UCI-2024', 'Windows 11 Pro', 'ADMIN-PC-01', 192, 168, 2, 10),
('BM008-UCI-2024', 'macOS Ventura', 'BIBLIO-MAC-01', 192, 168, 3, 10);

--  INSERTAR DATOS: Agent_Locations (Ubicaciones de agentes)
INSERT INTO agent_locations (agent_id, location_id, start_time, end_time) VALUES
(1, 5, '2024-01-15 08:00:00+00', NULL),  -- LAB-REDES-PC01 -> Laboratorio de Redes
(2, 5, '2024-01-15 08:00:00+00', NULL),  -- LAB-REDES-PC02 -> Laboratorio de Redes
(3, 6, '2024-01-20 08:00:00+00', NULL),  -- LAB-PROG-PC01 -> Laboratorio de Programación
(4, 6, '2024-01-20 08:00:00+00', NULL),  -- LAB-PROG-PC02 -> Laboratorio de Programación
(5, 7, '2024-02-01 08:00:00+00', NULL),  -- SERVER-WEB-01 -> Sala de Servidores
(6, 7, '2024-02-01 08:00:00+00', NULL),  -- SERVER-DB-01 -> Sala de Servidores
(7, 3, '2024-01-10 08:00:00+00', NULL),  -- ADMIN-PC-01 -> Oficinas Administrativas
(8, 4, '2024-03-01 08:00:00+00', NULL);  -- BIBLIO-MAC-01 -> Biblioteca Digital

--  INSERTAR DATOS: Inventories (Inventarios base)
INSERT INTO inventories (code, date, type, agent_id, parent_inventory_id) VALUES
-- Hardware inventories
('HW-001-2024', '2024-01-15 10:00:00+00', 'hardware', 1, NULL),
('HW-002-2024', '2024-01-15 11:00:00+00', 'hardware', 2, NULL),
('HW-003-2024', '2024-01-20 09:00:00+00', 'hardware', 3, NULL),
('HW-004-2024', '2024-01-20 10:00:00+00', 'hardware', 4, NULL),
('HW-005-2024', '2024-02-01 14:00:00+00', 'hardware', 5, NULL),
('HW-006-2024', '2024-02-01 15:00:00+00', 'hardware', 6, NULL),
('HW-007-2024', '2024-01-10 16:00:00+00', 'hardware', 7, NULL),
('HW-008-2024', '2024-03-01 12:00:00+00', 'hardware', 8, NULL),
-- Software inventories
('SW-001-2024', '2024-01-16 08:00:00+00', 'software', 1, NULL),
('SW-002-2024', '2024-01-16 08:30:00+00', 'software', 1, NULL),
('SW-003-2024', '2024-01-17 09:00:00+00', 'software', 2, NULL),
('SW-004-2024', '2024-01-21 10:00:00+00', 'software', 3, NULL),
('SW-005-2024', '2024-01-21 11:00:00+00', 'software', 4, NULL),
('SW-006-2024', '2024-02-02 08:00:00+00', 'software', 5, NULL),
('SW-007-2024', '2024-02-02 09:00:00+00', 'software', 6, NULL);

--  INSERTAR DATOS: Hardware_Inventories
INSERT INTO hardware_inventories (inventory_id, serial_number, supplier_name, model) VALUES
(1, 'DELL-SN-123456', 'Dell Technologies', 'OptiPlex 7090'),
(2, 'HP-SN-789012', 'HP Inc.', 'EliteDesk 800 G8'),
(3, 'LENOVO-SN-345678', 'Lenovo', 'ThinkCentre M75q'),
(4, 'ASUS-SN-901234', 'ASUS', 'VivoMini UN68'),
(5, 'DELL-SN-567890', 'Dell Technologies', 'PowerEdge R740'),
(6, 'HP-SN-123789', 'HP Inc.', 'ProLiant DL380 Gen10'),
(7, 'ACER-SN-456123', 'Acer', 'Veriton X2680G'),
(8, 'APPLE-SN-789456', 'Apple Inc.', 'Mac mini M2');

--  INSERTAR DATOS: Software_Inventories
INSERT INTO software_inventories (inventory_id, software_name, software_type) VALUES
(9, 'Microsoft Office 365', 'Productivity Suite'),
(10, 'Visual Studio Code', 'Development Environment'),
(11, 'LibreOffice', 'Productivity Suite'),
(12, 'IntelliJ IDEA', 'Development Environment'),
(13, 'Adobe Creative Suite', 'Design Software'),
(14, 'Apache Web Server', 'Web Server'),
(15, 'PostgreSQL Database', 'Database Management');

--  INSERTAR DATOS: Motherboards
INSERT INTO motherboards (hardware_inventory_id, name, version, capacity) VALUES
(1, 'Dell OptiPlex 7090 Motherboard', 'Rev A00', 'Supports up to 64GB RAM'),
(2, 'HP EliteDesk 800 G8 Motherboard', 'Rev 1.0', 'Supports up to 128GB RAM'),
(3, 'Lenovo ThinkCentre M75q Motherboard', 'Rev 2.1', 'Supports up to 32GB RAM'),
(4, 'ASUS VivoMini UN68 Motherboard', 'Rev 1.2', 'Supports up to 64GB RAM'),
(5, 'Dell PowerEdge R740 Motherboard', 'Rev A02', 'Supports up to 3TB RAM'),
(6, 'HP ProLiant DL380 Gen10 Motherboard', 'Rev 2.0', 'Supports up to 3TB RAM'),
(7, 'Acer Veriton X2680G Motherboard', 'Rev 1.0', 'Supports up to 32GB RAM'),
(8, 'Apple Mac mini M2 Logic Board', 'Rev A', 'Unified Memory Architecture');

--  INSERTAR DATOS: Processors
INSERT INTO processors (motherboard_id, family, speed, version, voltage) VALUES
(1, 'Intel Core i7-11700', '2.5 GHz', '11th Gen', '1.0V'),
(2, 'Intel Core i5-11500', '2.7 GHz', '11th Gen', '1.0V'),
(3, 'AMD Ryzen 5 Pro 4650GE', '3.3 GHz', 'Zen 2', '1.2V'),
(4, 'Intel Core i3-1115G4', '3.0 GHz', '11th Gen', '0.9V'),
(5, 'Intel Xeon Gold 6248R', '3.0 GHz', 'Cascade Lake', '1.1V'),
(6, 'Intel Xeon Gold 6230R', '2.1 GHz', 'Cascade Lake', '1.1V'),
(7, 'Intel Core i5-12400', '2.5 GHz', '12th Gen', '1.0V'),
(8, 'Apple M2', '3.49 GHz', 'M2', '1.0V');

--  INSERTAR DATOS: RAM_Memories
INSERT INTO ram_memories (motherboard_id, slot_number, type, dimension, data_width) VALUES
-- Dell OptiPlex 7090 (motherboard_id = 1)
(1, 1, 'DDR4', '16GB', '64-bit'),
(1, 2, 'DDR4', '16GB', '64-bit'),
-- HP EliteDesk 800 G8 (motherboard_id = 2)
(2, 1, 'DDR4', '8GB', '64-bit'),
(2, 3, 'DDR4', '8GB', '64-bit'),
-- Lenovo ThinkCentre M75q (motherboard_id = 3)
(3, 1, 'DDR4', '16GB', '64-bit'),
-- ASUS VivoMini UN68 (motherboard_id = 4)
(4, 1, 'DDR4', '8GB', '64-bit'),
(4, 2, 'DDR4', '8GB', '64-bit'),
-- Dell PowerEdge R740 (motherboard_id = 5)
(5, 1, 'DDR4', '32GB', '64-bit'),
(5, 2, 'DDR4', '32GB', '64-bit'),
(5, 3, 'DDR4', '32GB', '64-bit'),
(5, 4, 'DDR4', '32GB', '64-bit'),
-- HP ProLiant DL380 Gen10 (motherboard_id = 6)
(6, 1, 'DDR4', '64GB', '64-bit'),
(6, 2, 'DDR4', '64GB', '64-bit'),
-- Acer Veriton X2680G (motherboard_id = 7)
(7, 1, 'DDR4', '8GB', '64-bit'),
-- Apple Mac mini M2 (motherboard_id = 8) - Unified Memory
(8, 1, 'LPDDR5', '16GB', '128-bit');

-- 💽 INSERTAR DATOS: Storage_Devices
INSERT INTO storage_devices (hardware_inventory_id, communication_interface, capacity) VALUES
(1, 'NVMe SSD', '512GB'),
(1, 'SATA HDD', '1TB'),
(2, 'NVMe SSD', '256GB'),
(3, 'SATA SSD', '512GB'),
(4, 'NVMe SSD', '256GB'),
(5, 'SAS SSD', '960GB'),
(5, 'SAS SSD', '960GB'),
(6, 'SAS SSD', '1.92TB'),
(6, 'SAS HDD', '10TB'),
(7, 'SATA SSD', '256GB'),
(8, 'NVMe SSD', '512GB');

--  INSERTAR DATOS: IO_Devices
INSERT INTO io_devices (hardware_inventory_id, type, interface, family) VALUES
-- Dell OptiPlex 7090
(1, 'Monitor', 'DisplayPort', 'Dell UltraSharp'),
(1, 'Keyboard', 'USB', 'Dell KB216'),
(1, 'Mouse', 'USB', 'Dell MS116'),
-- HP EliteDesk 800 G8
(2, 'Monitor', 'HDMI', 'HP EliteDisplay'),
(2, 'Keyboard', 'USB', 'HP Wired Desktop'),
(2, 'Mouse', 'USB', 'HP Optical'),
-- Lenovo ThinkCentre M75q
(3, 'Monitor', 'DisplayPort', 'Lenovo ThinkVision'),
(3, 'Keyboard', 'USB', 'Lenovo Professional'),
(3, 'Mouse', 'USB', 'Lenovo Optical'),
-- ASUS VivoMini UN68
(4, 'Monitor', 'HDMI', 'ASUS VA24EHE'),
(4, 'Keyboard', 'Wireless', 'ASUS Wireless'),
(4, 'Mouse', 'Wireless', 'ASUS Optical'),
-- Dell PowerEdge R740 (Server)
(5, 'KVM Console', 'VGA', 'Dell Console'),
-- HP ProLiant DL380 Gen10 (Server)
(6, 'iLO Console', 'Network', 'HP Integrated'),
-- Acer Veriton X2680G
(7, 'Monitor', 'VGA', 'Acer SB220Q'),
(7, 'Keyboard', 'USB', 'Acer Standard'),
(7, 'Mouse', 'USB', 'Acer Optical'),
-- Apple Mac mini M2
(8, 'Monitor', 'Thunderbolt', 'Apple Studio Display'),
(8, 'Keyboard', 'Wireless', 'Apple Magic Keyboard'),
(8, 'Mouse', 'Wireless', 'Apple Magic Mouse');
