import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initializeDatabase, query } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345!';

app.use(cors());
app.use(express.json());

// Initialize Database before starting the server
await initializeDatabase().catch(err => {
  console.error("Critical: Could not initialize database. Server might fail to handle queries.", err.message);
});

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

// Middleware: Check if Admin
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden. Admin role required.' });
  }
}

// ----------------------------------------
// AUTH ROUTES
// ----------------------------------------

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    // Check if email already exists
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await query(
      'INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, 'client']
    );

    const userId = result.insertId;

    // Generate JWT Token
    const token = jwt.sign(
      { userId: userId, email: email, role: 'client' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        role: 'client'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    // Find user
    const [users] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Get Current User Profile (Me)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

// ----------------------------------------
// BOOKINGS ROUTES
// ----------------------------------------

// Get Bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      // Admin gets all bookings
      const [rows] = await query('SELECT * FROM bookings ORDER BY createdAt DESC');
      bookings = rows;
    } else {
      // Client gets only their bookings
      const [rows] = await query('SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC', [req.user.userId]);
      bookings = rows;
    }
    
    // Map database properties (extra 0/1 to boolean)
    const formattedBookings = bookings.map(b => ({
      ...b,
      extra: !!b.extra
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Server error fetching bookings.' });
  }
});

// Create Booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { address, cylinderType, date, extra } = req.body;

  if (!address || !cylinderType || !date) {
    return res.status(400).json({ message: 'Please provide all booking details.' });
  }

  try {
    const [result] = await query(
      'INSERT INTO bookings (userId, address, cylinderType, date, extra, status, paymentStatus) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, address, cylinderType, date, extra ? 1 : 0, 'pending', 'unpaid']
    );

    res.status(201).json({
      id: result.insertId,
      userId: req.user.userId,
      address,
      cylinderType,
      date,
      extra: !!extra,
      status: 'pending',
      paymentStatus: 'unpaid'
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error creating booking.' });
  }
});

// Get Specific Booking
app.get('/api/bookings/:bookingId', authenticateToken, async (req, res) => {
  const { bookingId } = req.params;

  try {
    const [rows] = await query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = rows[0];

    // Check authorization: client can only read their own bookings
    if (req.user.role !== 'admin' && booking.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({
      ...booking,
      extra: !!booking.extra
    });
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({ message: 'Server error fetching booking.' });
  }
});

// Update Booking Status / Payment
app.put('/api/bookings/:bookingId', authenticateToken, async (req, res) => {
  const { bookingId } = req.params;
  const { status, paymentStatus } = req.body;

  try {
    const [rows] = await query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = rows[0];

    // Authorize booking updates
    // Admin can update status and paymentStatus
    // Client can update paymentStatus to "paid"
    let updateFields = [];
    let params = [];

    if (req.user.role === 'admin') {
      if (status !== undefined) {
        updateFields.push('status = ?');
        params.push(status);
      }
      if (paymentStatus !== undefined) {
        updateFields.push('paymentStatus = ?');
        params.push(paymentStatus);
      }
    } else {
      // Client is trying to update
      if (booking.userId !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied.' });
      }
      // Client can only update payment status to paid
      if (paymentStatus === 'paid') {
        updateFields.push('paymentStatus = ?');
        params.push('paid');
      } else if (status !== undefined) {
        return res.status(403).json({ message: 'Clients cannot change booking approval status.' });
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid updates provided.' });
    }

    params.push(bookingId);
    await query(`UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Booking updated successfully.' });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error updating booking.' });
  }
});

// ----------------------------------------
// NOTICES ROUTES
// ----------------------------------------

// Get notices
app.get('/api/notices', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM notices ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error('Fetch notices error:', error);
    res.status(500).json({ message: 'Server error fetching notices.' });
  }
});

// Post notice
app.post('/api/notices', authenticateToken, requireAdmin, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Please provide title and content.' });
  }

  try {
    const [result] = await query('INSERT INTO notices (title, content) VALUES (?, ?)', [title, content]);
    res.status(201).json({
      id: result.insertId,
      title,
      content,
      date: new Date()
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ message: 'Server error posting notice.' });
  }
});

// ----------------------------------------
// USER LIST (ADMIN ONLY, for users mapping)
// ----------------------------------------
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await query('SELECT id, name, email FROM users');
    
    // Convert to mapping format { id: { name, email } }
    const usersMap = {};
    users.forEach(u => {
      usersMap[u.id] = { name: u.name, email: u.email };
    });

    res.json(usersMap);
  } catch (error) {
    console.error('Fetch users mapping error:', error);
    res.status(500).json({ message: 'Server error fetching users mapping.' });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});
