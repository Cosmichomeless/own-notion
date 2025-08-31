-- Schema para aplicación de deudas
-- Ejecutar en el SQL Editor de Supabase

-- Tabla para almacenar los datos del usuario
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para las deudas
CREATE TABLE debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  person_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_due TIMESTAMP WITH TIME ZONE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para user_profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas de seguridad para debts
CREATE POLICY "Los usuarios pueden ver sus propias deudas" ON debts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar sus propias deudas" ON debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias deudas" ON debts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propias deudas" ON debts
  FOR DELETE USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at 
  BEFORE UPDATE ON debts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar el rendimiento
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_person_name ON debts(person_name);
CREATE INDEX idx_debts_is_paid ON debts(is_paid);
CREATE INDEX idx_debts_date_created ON debts(date_created);