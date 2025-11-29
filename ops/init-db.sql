-- Инициализация базы данных

-- Создание символов
INSERT INTO symbols (name) VALUES 
('EURJPY'),
('EURUSD'),
('GBPUSD'),
('USDJPY'),
('AUDUSD'),
('USDCAD'),
('NZDUSD'),
('USDCHF'),
('EURGBP'),
('GBPJPY')
ON CONFLICT (name) DO NOTHING;

-- Проверка
SELECT 'Symbols created:' as info, COUNT(*) as count FROM symbols;
-- Создание символов
INSERT INTO symbols (name) VALUES 
('EURJPY'),
('EURUSD'),
('GBPUSD'),
('USDJPY'),
('AUDUSD'),
('USDCAD'),
('NZDUSD'),
('USDCHF'),
('EURGBP'),
('GBPJPY')
ON CONFLICT (name) DO NOTHING;

-- Проверка
SELECT 'Symbols created:' as info, COUNT(*) as count FROM symbols;