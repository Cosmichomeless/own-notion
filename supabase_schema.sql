-- =====================================================
-- ESQUEMA SQL PARA SUPABASE - FINANZAS PERSONALES
-- =====================================================
-- Ejecuta estos comandos en el SQL Editor de Supabase
-- =====================================================

-- 1. TABLA DE PERFILES DE USUARIO
-- Esta tabla almacena información adicional del usuario
CREATE TABLE user_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índice para búsquedas por user_id
CREATE INDEX idx_user_profile_user_id ON user_profile(user_id);

-- 2. TABLA DE DEUDAS
-- Esta tabla almacena todas las deudas (tanto las que debo como las que me deben)
CREATE TABLE debts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('owed', 'owe')), -- 'owed' = me deben, 'owe' = debo
    person TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    description TEXT DEFAULT '',
    date DATE NOT NULL,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_type ON debts(user_id, type);
CREATE INDEX idx_debts_person ON debts(user_id, person);
CREATE INDEX idx_debts_created ON debts(user_id, created DESC);

-- 3. TABLA DE ACTIVIDADES
-- Esta tabla almacena el registro de actividades del usuario
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'finance', 'config', etc.
    text TEXT NOT NULL,
    icon TEXT DEFAULT '📋',
    time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para actividades
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_time ON activities(user_id, time DESC);

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA user_profile
-- Los usuarios solo pueden ver y modificar su propio perfil
CREATE POLICY "Users can view their own profile" ON user_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profile
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profile
    FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA debts
-- Los usuarios solo pueden ver y modificar sus propias deudas
CREATE POLICY "Users can view their own debts" ON debts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts" ON debts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts" ON debts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts" ON debts
    FOR DELETE USING (auth.uid() = user_id);

-- POLÍTICAS PARA activities
-- Los usuarios solo pueden ver y modificar sus propias actividades
CREATE POLICY "Users can view their own activities" ON activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" ON activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" ON activities
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_user_profile_updated_at
    BEFORE UPDATE ON user_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================
-- Puedes descomentar estas líneas después de autenticarte
-- para insertar algunos datos de prueba

/*
-- Ejemplo de perfil de usuario (reemplaza el UUID con tu ID de usuario)
INSERT INTO user_profile (user_id, name) 
VALUES ('tu-user-id-aqui', 'Tu Nombre');

-- Ejemplos de deudas
INSERT INTO debts (user_id, type, person, amount, description, date) VALUES
('tu-user-id-aqui', 'owed', 'Juan Pérez', 150.00, 'Préstamo personal', '2024-01-15'),
('tu-user-id-aqui', 'owe', 'María García', 80.50, 'Cena en restaurante', '2024-01-10'),
('tu-user-id-aqui', 'owed', 'Carlos López', 300.00, 'Trabajo freelance', '2024-01-12');

-- Ejemplos de actividades
INSERT INTO activities (user_id, type, text, icon) VALUES
('tu-user-id-aqui', 'finance', 'Nueva deuda registrada: Juan Pérez - $150.00', '💵'),
('tu-user-id-aqui', 'finance', 'Deuda eliminada: Ana Rodríguez', '🗑️'),
('tu-user-id-aqui', 'config', 'Perfil actualizado', '⚙️');
*/

-- =====================================================
-- VERIFICACIÓN DEL ESQUEMA
-- =====================================================
-- Puedes ejecutar estas consultas para verificar que todo esté correcto

-- Verificar tablas creadas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profile', 'debts', 'activities');

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_profile', 'debts', 'activities');

-- Verificar índices
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('user_profile', 'debts', 'activities');

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
/*
1. Copia y pega este SQL completo en el SQL Editor de Supabase
2. Ejecuta todo el script de una vez
3. Verifica que las tablas se hayan creado correctamente
4. Las políticas RLS garantizan que cada usuario solo vea sus propios datos
5. Los índices optimizan las consultas para mejor rendimiento
6. La aplicación web ya está configurada para usar estas tablas

NOTAS IMPORTANTES:
- Las políticas RLS usan auth.uid() que obtiene automáticamente el ID del usuario autenticado
- Los triggers actualizan automáticamente el campo updated_at cuando se modifica un registro
- Todas las tablas están relacionadas con auth.users, por lo que se eliminan automáticamente si se borra un usuario
- Los tipos de deuda son: 'owed' (me deben) y 'owe' (debo)
- Los montos se almacenan como DECIMAL(12,2) para precisión financiera
*/
