-- Create the auth_server database if it doesn't exist
SELECT 'CREATE DATABASE auth_server' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_server')\gexec