-- SQL Query to disable maintenance mode
UPDATE system_config
SET value = 'false'
WHERE key = 'maintenance_mode';