-- Create database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TrasportoSociale')
BEGIN
    CREATE DATABASE TrasportoSociale;
END
GO

USE TrasportoSociale;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        address NVARCHAR(500),
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create Drivers table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Drivers' AND xtype='U')
BEGIN
    CREATE TABLE Drivers (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        licenseNumber NVARCHAR(100),
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create Destinations table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Destinations' AND xtype='U')
BEGIN
    CREATE TABLE Destinations (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Create Transports table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Transports' AND xtype='U')
BEGIN
    CREATE TABLE Transports (
        id NVARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        time TIME NOT NULL,
        userId NVARCHAR(50) NOT NULL,
        driverId NVARCHAR(50) NOT NULL,
        destinationId NVARCHAR(50) NOT NULL,
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Transports_Users FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        CONSTRAINT FK_Transports_Drivers FOREIGN KEY (driverId) REFERENCES Drivers(id) ON DELETE CASCADE,
        CONSTRAINT FK_Transports_Destinations FOREIGN KEY (destinationId) REFERENCES Destinations(id) ON DELETE CASCADE
    );
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Transports_Date')
BEGIN
    CREATE INDEX IX_Transports_Date ON Transports(date);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Transports_UserId')
BEGIN
    CREATE INDEX IX_Transports_UserId ON Transports(userId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Transports_DriverId')
BEGIN
    CREATE INDEX IX_Transports_DriverId ON Transports(driverId);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Transports_DestinationId')
BEGIN
    CREATE INDEX IX_Transports_DestinationId ON Transports(destinationId);
END
GO

-- Insert sample data (optional)
-- Users
IF NOT EXISTS (SELECT * FROM Users)
BEGIN
    INSERT INTO Users (id, name, phone, address, notes) VALUES
    ('user1', 'Mario Rossi', '333-1234567', 'Via Roma 123, Milano', 'Utente di prova'),
    ('user2', 'Giulia Bianchi', '333-7654321', 'Via Garibaldi 45, Roma', 'Necessita accompagnatore'),
    ('user3', 'Francesco Verdi', '333-9876543', 'Corso Italia 78, Torino', 'Trasporto regolare');
END
GO

-- Drivers
IF NOT EXISTS (SELECT * FROM Drivers)
BEGIN
    INSERT INTO Drivers (id, name, phone, licenseNumber, notes) VALUES
    ('driver1', 'Antonio Ferrari', '340-1111111', 'MI123456789', 'Autista esperto'),
    ('driver2', 'Maria Colombo', '340-2222222', 'RM987654321', 'Disponibile mattina'),
    ('driver3', 'Giuseppe Ricci', '340-3333333', 'TO456789123', 'Autista part-time');
END
GO

-- Destinations
IF NOT EXISTS (SELECT * FROM Destinations)
BEGIN
    INSERT INTO Destinations (id, name, address, cost, notes) VALUES
    ('dest1', 'Ospedale San Raffaele', 'Via Olgettina 60, Milano', 15.50, 'Ingresso principale'),
    ('dest2', 'Centro Medico Roma', 'Via del Corso 100, Roma', 12.00, 'Piano terra'),
    ('dest3', 'Clinica Torino', 'Via Po 25, Torino', 18.75, 'Parcheggio disponibile');
END
GO

PRINT 'Database TrasportoSociale created successfully with sample data!';