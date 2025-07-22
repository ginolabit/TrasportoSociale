import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    // Create AuthUsers table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuthUsers' AND xtype='U')
      CREATE TABLE AuthUsers (
        id NVARCHAR(50) PRIMARY KEY,
        username NVARCHAR(100) UNIQUE NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        fullName NVARCHAR(255) NOT NULL,
        passwordHash NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) DEFAULT 'user',
        isApproved BIT DEFAULT 0,
        createdAt DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create AccessRequests table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AccessRequests' AND xtype='U')
      CREATE TABLE AccessRequests (
        id NVARCHAR(50) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        fullName NVARCHAR(255) NOT NULL,
        passwordHash NVARCHAR(255) NOT NULL,
        status NVARCHAR(20) DEFAULT 'pending',
        requestedAt DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        address NVARCHAR(500),
        city NVARCHAR(100),
        province NVARCHAR(100),
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

    // Create Transports table with NVARCHAR time field
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sysobjects WHERE name='Transports' AND xtype='U')
      BEGIN
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                       WHERE TABLE_NAME = 'Transports' AND COLUMN_NAME = 'startTime')
        BEGIN
          CREATE TABLE Transports_New (
            id NVARCHAR(50) PRIMARY KEY,
            date DATE NOT NULL,
            startTime NVARCHAR(8) NOT NULL,
            endTime NVARCHAR(8),
            userId NVARCHAR(50) NOT NULL,
            driverId NVARCHAR(50) NOT NULL,
            destinationId NVARCHAR(50) NOT NULL,
            isRecurring BIT DEFAULT 0,
            recurringType NVARCHAR(20),
            recurringEndDate DATE,
            notes NVARCHAR(1000),
            createdAt DATETIME2 DEFAULT GETDATE(),
            FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (driverId) REFERENCES Drivers(id) ON DELETE CASCADE,
            FOREIGN KEY (destinationId) REFERENCES Destinations(id) ON DELETE CASCADE
          );
          
          INSERT INTO Transports_New (id, date, startTime, userId, driverId, destinationId, notes, createdAt)
          SELECT id, date, 
                 CASE 
                   WHEN COLUMNPROPERTY(OBJECT_ID('Transports'), 'time', 'ColumnId') IS NOT NULL 
                   THEN FORMAT(CAST(time AS TIME), 'HH\\:mm') 
                   ELSE startTime 
                 END as startTime,
                 userId, driverId, destinationId, notes, createdAt
          FROM Transports;
          
          DROP TABLE Transports;
          EXEC sp_rename 'Transports_New', 'Transports';
        END
      END
      ELSE
      BEGIN
        CREATE TABLE Transports (
          id NVARCHAR(50) PRIMARY KEY,
          date DATE NOT NULL,
          startTime NVARCHAR(8) NOT NULL,
          endTime NVARCHAR(8),
          userId NVARCHAR(50) NOT NULL,
          driverId NVARCHAR(50) NOT NULL,
          destinationId NVARCHAR(50) NOT NULL,
          isRecurring BIT DEFAULT 0,
          recurringType NVARCHAR(20),
          recurringEndDate DATE,
          notes NVARCHAR(1000),
          createdAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
          FOREIGN KEY (driverId) REFERENCES Drivers(id) ON DELETE CASCADE,
          FOREIGN KEY (destinationId) REFERENCES Destinations(id) ON DELETE CASCADE
        );
      END
    `);

    // Create default admin user if no users exist
    const adminCheck = await pool.request().query('SELECT COUNT(*) as count FROM AuthUsers WHERE role = \'admin\'');
    if (adminCheck.recordset[0].count === 0) {
      const adminId = generateId();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.request()
        .input('id', sql.NVarChar, adminId)
        .input('username', sql.NVarChar, 'admin')
        .input('email', sql.NVarChar, 'admin@trasportosociale.it')
        .input('fullName', sql.NVarChar, 'Amministratore')
        .input('passwordHash', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'admin')
        .input('isApproved', sql.Bit, true)
        .query('INSERT INTO AuthUsers (id, username, email, fullName, passwordHash, role, isApproved) VALUES (@id, @username, @email, @fullName, @passwordHash, @role, @isApproved)');
      
      console.log('Default admin user created: admin / admin123');
    }

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
};

// Helper function to generate ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to validate and format time
const validateAndFormatTime = (timeInput) => {
  if (!timeInput) return null;
  
  try {
    const timeStr = timeInput.toString().trim();
    const timeRegex = /^(\d{1,2}):(\d{2})$/;
    const match = timeStr.match(timeRegex);
    
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error validating time:', error);
    return null;
  }
};

// Helper function to format date for consistent output
const formatDateForOutput = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateValue;
  }
};

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.NVarChar, decoded.userId)
      .query('SELECT id, username, email, fullName, role, isApproved FROM AuthUsers WHERE id = @id AND isApproved = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid token or user not approved' });
    }
    
    req.user = result.recordset[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, fullName, password } = req.body;
    
    if (!username || !email || !fullName || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const pool = await poolPromise;
    
    // Check if username or email already exists
    const existingUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM AuthUsers WHERE username = @username OR email = @email UNION SELECT id FROM AccessRequests WHERE username = @username OR email = @email');
    
    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const id = generateId();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('fullName', sql.NVarChar, fullName)
      .input('passwordHash', sql.NVarChar, hashedPassword)
      .query('INSERT INTO AccessRequests (id, username, email, fullName, passwordHash) VALUES (@id, @username, @email, @fullName, @passwordHash)');
    
    res.status(201).json({ message: 'Registration request submitted. Wait for admin approval.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM AuthUsers WHERE username = @username AND isApproved = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or account not approved' });
    }

    const user = result.recordset[0];
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isApproved: user.isApproved,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const pool = await poolPromise;
    
    // Get current user with password hash
    const userResult = await pool.request()
      .input('id', sql.NVarChar, userId)
      .query('SELECT passwordHash FROM AuthUsers WHERE id = @id');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.recordset[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    await pool.request()
      .input('id', sql.NVarChar, userId)
      .input('passwordHash', sql.NVarChar, newPasswordHash)
      .query('UPDATE AuthUsers SET passwordHash = @passwordHash WHERE id = @id');
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/access-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT id, username, email, fullName, status, requestedAt FROM AccessRequests ORDER BY requestedAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/access-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    // Get the request
    const requestResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM AccessRequests WHERE id = @id AND status = \'pending\'');
    
    if (requestResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    const request = requestResult.recordset[0];
    const userId = generateId();
    
    // Create user in AuthUsers
    await pool.request()
      .input('id', sql.NVarChar, userId)
      .input('username', sql.NVarChar, request.username)
      .input('email', sql.NVarChar, request.email)
      .input('fullName', sql.NVarChar, request.fullName)
      .input('passwordHash', sql.NVarChar, request.passwordHash)
      .input('role', sql.NVarChar, 'user')
      .input('isApproved', sql.Bit, true)
      .query('INSERT INTO AuthUsers (id, username, email, fullName, passwordHash, role, isApproved) VALUES (@id, @username, @email, @fullName, @passwordHash, @role, @isApproved)');
    
    // Update request status
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('UPDATE AccessRequests SET status = \'approved\' WHERE id = @id');
    
    res.json({ message: 'Request approved successfully' });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/access-requests/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('UPDATE AccessRequests SET status = \'rejected\' WHERE id = @id');
    
    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management endpoints
app.get('/api/auth/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT id, username, email, fullName, role, isApproved, createdAt FROM AuthUsers WHERE isApproved = 1 ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/auth/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent self-modification
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own role' });
    }

    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('role', sql.NVarChar, role)
      .query('UPDATE AuthUsers SET role = @role WHERE id = @id');
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/auth/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM AuthUsers WHERE id = @id');
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users endpoints
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Users ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, city, province, notes } = req.body;
    const id = generateId();
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('city', sql.NVarChar, city || null)
      .input('province', sql.NVarChar, province || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('INSERT INTO Users (id, name, phone, address, city, province, notes) VALUES (@id, @name, @phone, @address, @city, @province, @notes)');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, city, province, notes } = req.body;
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('city', sql.NVarChar, city || null)
      .input('province', sql.NVarChar, province || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('UPDATE Users SET name = @name, phone = @phone, address = @address, city = @city, province = @province, notes = @notes WHERE id = @id');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
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
app.get('/api/drivers', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Drivers ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/drivers', authenticateToken, async (req, res) => {
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

app.put('/api/drivers/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/drivers/:id', authenticateToken, async (req, res) => {
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
app.get('/api/destinations', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Destinations ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/destinations', authenticateToken, async (req, res) => {
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

app.put('/api/destinations/:id', authenticateToken, async (req, res) => {
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

app.delete('/api/destinations/:id', authenticateToken, async (req, res) => {
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
app.get('/api/transports', authenticateToken, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Transports ORDER BY date DESC, startTime DESC');
    
    // Format dates consistently
    const formattedTransports = result.recordset.map(transport => ({
      ...transport,
      date: formatDateForOutput(transport.date)
    }));
    
    res.json(formattedTransports);
  } catch (error) {
    console.error('Error fetching transports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transports', authenticateToken, async (req, res) => {
  try {
    const { date, startTime, endTime, userId, driverId, destinationId, isRecurring, recurringType, recurringEndDate, notes } = req.body;
    const pool = await poolPromise;
    
    const formattedStartTime = validateAndFormatTime(startTime);
    if (!formattedStartTime) {
      return res.status(400).json({ error: 'Formato orario non valido. Usa il formato HH:MM (es: 14:30)' });
    }
    
    const formattedEndTime = endTime ? validateAndFormatTime(endTime) : null;
    
    const createTransport = async (transportDate) => {
      const id = generateId();
      await pool.request()
        .input('id', sql.NVarChar, id)
        .input('date', sql.Date, transportDate)
        .input('startTime', sql.NVarChar, formattedStartTime)
        .input('endTime', sql.NVarChar, formattedEndTime)
        .input('userId', sql.NVarChar, userId)
        .input('driverId', sql.NVarChar, driverId)
        .input('destinationId', sql.NVarChar, destinationId)
        .input('isRecurring', sql.Bit, isRecurring || false)
        .input('recurringType', sql.NVarChar, recurringType || null)
        .input('recurringEndDate', sql.Date, recurringEndDate || null)
        .input('notes', sql.NVarChar, notes || null)
        .query('INSERT INTO Transports (id, date, startTime, endTime, userId, driverId, destinationId, isRecurring, recurringType, recurringEndDate, notes) VALUES (@id, @date, @startTime, @endTime, @userId, @driverId, @destinationId, @isRecurring, @recurringType, @recurringEndDate, @notes)');
      return id;
    };
    
    const createdIds = [];
    
    if (isRecurring && recurringType && recurringEndDate) {
      const startDate = new Date(date);
      const endDate = new Date(recurringEndDate);
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const id = await createTransport(dateStr);
        createdIds.push(id);
        
        switch (recurringType) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
    } else {
      const id = await createTransport(date);
      createdIds.push(id);
    }
    
    const result = await pool.request()
      .input('ids', sql.NVarChar, createdIds.join(','))
      .query(`SELECT * FROM Transports WHERE id IN (${createdIds.map(() => '?').join(',')})`, createdIds);
    
    const transports = result.recordset.map(transport => ({
      ...transport,
      date: formatDateForOutput(transport.date)
    }));
    
    res.status(201).json(transports.length === 1 ? transports[0] : transports);
  } catch (error) {
    console.error('Error creating transport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/transports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, userId, driverId, destinationId, isRecurring, recurringType, recurringEndDate, notes } = req.body;
    const pool = await poolPromise;
    
    const formattedStartTime = validateAndFormatTime(startTime);
    if (!formattedStartTime) {
      return res.status(400).json({ error: 'Formato orario non valido. Usa il formato HH:MM (es: 14:30)' });
    }
    
    const formattedEndTime = endTime ? validateAndFormatTime(endTime) : null;
    
    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('date', sql.Date, date)
      .input('startTime', sql.NVarChar, formattedStartTime)
      .input('endTime', sql.NVarChar, formattedEndTime)
      .input('userId', sql.NVarChar, userId)
      .input('driverId', sql.NVarChar, driverId)
      .input('destinationId', sql.NVarChar, destinationId)
      .input('isRecurring', sql.Bit, isRecurring || false)
      .input('recurringType', sql.NVarChar, recurringType || null)
      .input('recurringEndDate', sql.Date, recurringEndDate || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('UPDATE Transports SET date = @date, startTime = @startTime, endTime = @endTime, userId = @userId, driverId = @driverId, destinationId = @destinationId, isRecurring = @isRecurring, recurringType = @recurringType, recurringEndDate = @recurringEndDate, notes = @notes WHERE id = @id');
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM Transports WHERE id = @id');
    
    const transport = result.recordset[0];
    const formattedTransport = {
      ...transport,
      date: formatDateForOutput(transport.date)
    };
    
    res.json(formattedTransport);
  } catch (error) {
    console.error('Error updating transport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/transports/:id', authenticateToken, async (req, res) => {
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