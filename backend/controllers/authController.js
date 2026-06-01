const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Demo accounts for testing without MongoDB
const DEMO_ACCOUNTS = {
  'collector1@artchain.com': { password: 'demo123', name: 'Adeola Okafor', location: 'Lagos, Nigeria' },
  'collector2@artchain.com': { password: 'demo123', name: 'Chisom Egobi', location: 'Accra, Ghana' },
  'artist@artchain.com': { password: 'demo123', name: 'Emeka Osei', location: 'Nairobi, Kenya' },
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;

    // Try using MongoDB first
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      user = new User({
        name,
        email,
        password,
        location
      });

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
        expiresIn: '30d'
      });

      return res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location
        }
      });
    } catch (dbErr) {
      // Fallback: Use mock account for demo
      console.log('MongoDB unavailable, using demo account');
      
      const token = jwt.sign(
        { id: `demo_${Date.now()}`, isDemo: true },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: `demo_${Date.now()}`,
          name,
          email,
          location,
          isDemo: true
        }
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try MongoDB first
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
        expiresIn: '30d'
      });

      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          location: user.location
        }
      });
    } catch (dbErr) {
      // Fallback: Demo accounts
      console.log('MongoDB unavailable, checking demo accounts');
      
      if (DEMO_ACCOUNTS[email] && DEMO_ACCOUNTS[email].password === password) {
        const demoUser = DEMO_ACCOUNTS[email];
        const token = jwt.sign(
          { id: `demo_${email}`, isDemo: true },
          process.env.JWT_SECRET || 'your_jwt_secret_key_here',
          { expiresIn: '30d' }
        );

        return res.json({
          token,
          user: {
            id: `demo_${email}`,
            name: demoUser.name,
            email,
            location: demoUser.location,
            isDemo: true
          }
        });
      }

      return res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('collection');
    res.json(user);
  } catch (err) {
    // Demo profile fallback
    res.json({
      id: req.userId,
      name: 'Demo User',
      email: 'demo@artchain.com',
      location: 'Lagos, Nigeria',
      collection: [],
      isDemo: true
    });
  }
};
