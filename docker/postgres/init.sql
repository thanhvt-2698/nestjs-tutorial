SELECT 'CREATE DATABASE nestjs_tutorial_test'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'nestjs_tutorial_test'
)\gexec
