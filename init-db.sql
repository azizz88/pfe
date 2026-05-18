-- Initialisation PostgreSQL
-- Crée les deux bases utilisées par les microservices SIRH.
-- (POSTGRES_DB = "sirh" est créée automatiquement par l'image, on ajoute juste les deux bases applicatives.)

CREATE DATABASE sirh_employees;
CREATE DATABASE sirh_recruitment;
