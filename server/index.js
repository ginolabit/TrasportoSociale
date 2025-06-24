import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'TrasportoSociale',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Database connection
let poolPromise;

const initializeDatabase = async () => {
  try {
    poolPromise = new sql.ConnectionPool(dbConfig).connect();
    const pool = await poolPromise;
    console.log('Connected to SQL Server database');
    
    // Initialize database schema
    await initializeSchema(pool);
    
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const initializeSchema = async (pool) => {
  try {
    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        address NVARCHAR(500),
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create Drivers table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Drivers' AND xtype='U')
      CREATE TABLE Drivers (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        licenseNumber NVARCHAR(100),
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create Destinations table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Destinations' AND xtype='U')
      CREATE TABLE Destinations (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        address NVARCHAR(500) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create Transports table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Transports' AND xtype='U')
      CREATE TABLE Transports (
        id NVARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        time TIME NOT NULL,
        userId NVARCHAR(50) NOT NULL,
        driverId NVARCHAR(50) NOT NULL,
        destinationId NVARCHAR(50) NOT NULL,
        notes NVARCHAR(1000),
        createdAt DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (driverId) REFERENCES Drivers(id) ON DELETE CASCADE,
        FOREIGN KEY (destinationId) REFERENCES Destinations(id) ON DELETE CASCADE
      )
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};

// Helper function to generate ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to format time for SQL Server
const formatTimeForSQL = (timeString) => {
  if (!timeString) return null;
  
  try {
    // Remove any extra whitespace
    timeString = timeString.trim();
    
    // If it's already in HH:MM:SS format, return as is
    if (timeString.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // If it's in HH:MM format, add seconds
    if (timeString.match(/^\d{1,2}:\d{2}$/)) {
      return timeString + ':00';
    }
    
    // Try to parse and reformat
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }
    }
  } catch (error) {
    console.error('Error parsing time:', error);
  }
  
  return null;
};

// Helper function to format time for display (HH:MM)
const formatTimeForDisplay = (timeString) => {
  if (!timeString) return '';
  
  try {
    // If it's a time object from SQL Server, convert to string first
    if (typeof timeString === 'object' && timeString.getHours) {
      const hours = timeString.getHours().toString().padStart(2, '0');
      const minutes = timeString.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // If it's already a string, parse it
    const timeStr = timeString.toString();
    
    // Handle HH:MM:SS.sssssss format from SQL Server
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10).toString().padStart(2, '0');
        const minutes = parseInt(parts[1], 10).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    
    return timeStr;
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return timeString;
  }
};

// Helper function to format date for display (YYYY-MM-DD)
const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return dateValue;
  }
};

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Users ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    const id = generateId();
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('INSERT INTO Users (id, name, phone, address, notes) VALUES (@id, @name, @phone, @address, @notes)');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, notes } = req.body;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('UPDATE Users SET name = @name, phone = @phone, address = @address, notes = @notes WHERE id = @id');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Users WHERE id = @id');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Drivers endpoints
app.get('/api/drivers', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Drivers ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/drivers', async (req, res) => {
  try {
    const { name, phone, licenseNumber, notes } = req.body;
    const id = generateId();
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('licenseNumber', sql.NVarChar, licenseNumber || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('INSERT INTO Drivers (id, name, phone, licenseNumber, notes) VALUES (@id, @name, @phone, @licenseNumber, @notes)');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Drivers WHERE id = @id');
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, licenseNumber, notes } = req.body;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('licenseNumber', sql.NVarChar, licenseNumber || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('UPDATE Drivers SET name = @name, phone = @phone, licenseNumber = @licenseNumber, notes = @notes WHERE id = @id');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Drivers WHERE id = @id');
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Drivers WHERE id = @id');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Destinations endpoints
app.get('/api/destinations', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Destinations ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/destinations', async (req, res) => {
  try {
    const { name, address, cost, notes } = req.body;
    const id = generateId();
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('address', sql.NVarChar, address)
      .input('cost', sql.Decimal(10, 2), cost)
      .input('notes', sql.NVarChar, notes || null)
      .query('INSERT INTO Destinations (id, name, address, cost, notes) VALUES (@id, @name, @address, @cost, @notes)');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Destinations WHERE id = @id');
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating destination:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, cost, notes } = req.body;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('address', sql.NVarChar, address)
      .input('cost', sql.Decimal(10, 2), cost)
      .input('notes', sql.NVarChar, notes || null)
      .query('UPDATE Destinations SET name = @name, address = @address, cost = @cost, notes = @notes WHERE id = @id');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Destinations WHERE id = @id');
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Destinations WHERE id = @id');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transports endpoints
app.get('/api/transports', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Transports ORDER BY date DESC, time DESC');
    
    // Format the data for display
    const formattedTransports = result.recordset.map(transport => ({
      ...transport,
      date: formatDateForDisplay(transport.date),
      time: formatTimeForDisplay(transport.time)
    }));
    
    res.json(formattedTransports);
  } catch (error) {
    console.error('Error fetching transports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transports', async (req, res) => {
  try {
    const { date, time, userId, driverId, destinationId, notes } = req.body;
    const id = generateId();
    const pool = await poolPromise;
    
    // Format time for SQL Server
    const formattedTime = formatTimeForSQL(time);
    if (!formattedTime) {
      console.error('Invalid time format received:', time);
      return res.status(400).json({ error: 'Invalid time format. Please use HH:MM format.' });
    }
    
    console.log('Creating transport with:', { date, time, formattedTime, userId, driverId, destinationId });
    
    // Use string interpolation instead of parameterized query for time
    const query = `
      INSERT INTO Transports (id, date, time, userId, driverId, destinationId, notes) 
      VALUES (@id, @date, '${formattedTime}', @userId, @driverId, @destinationId, @notes)
    `;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('date', sql.Date, date)
      .input('userId', sql.NVarChar, userId)
      .input('driverId', sql.NVarChar, driverId)
      .input('destinationId', sql.NVarChar, destinationId)
      .input('notes', sql.NVarChar, notes || null)
      .query(query);
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Transports WHERE id = @id');
    
    // Format the response data
    const transport = result.recordset[0];
    const formattedTransport = {
      ...transport,
      date: formatDateForDisplay(transport.date),
      time: formatTimeForDisplay(transport.time)
    };
    
    res.status(201).json(formattedTransport);
  } catch (error) {
    console.error('Error creating transport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/transports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, userId, driverId, destinationId, notes } = req.body;
    const pool = await poolPromise;
    
    // Format time for SQL Server
    const formattedTime = formatTimeForSQL(time);
    if (!formattedTime) {
      console.error('Invalid time format received:', time);
      return res.status(400).json({ error: 'Invalid time format. Please use HH:MM format.' });
    }
    
    console.log('Updating transport with:', { date, time, formattedTime, userId, driverId, destinationId });
    
    // Use string interpolation instead of parameterized query for time
    const query = `
      UPDATE Transports 
      SET date = @date, time = '${formattedTime}', userId = @userId, driverId = @driverId, destinationId = @destinationId, notes = @notes 
      WHERE id = @id
    `;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('date', sql.Date, date)
      .input('userId', sql.NVarChar, userId)
      .input('driverId', sql.NVarChar, driverId)
      .input('destinationId', sql.NVarChar, destinationId)
      .input('notes', sql.NVarChar, notes || null)
      .query(query);
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Transports WHERE id = @id');
    
    // Format the response data
    const transport = result.recordset[0];
    const formattedTransport = {
      ...transport,
      date: formatDateForDisplay(transport.date),
      time: formatTimeForDisplay(transport.time)
    };
    
    res.json(formattedTransport);
  } catch (error) {
    console.error('Error updating transport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/transports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Transports WHERE id = @id');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });