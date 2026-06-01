const Artwork = require('../models/Artwork');

exports.createArtwork = async (req, res) => {
  try {
    const { title, artist, description, estimatedValue, medium, condition, dimensions } = req.body;

    const artwork = new Artwork({
      title,
      artist,
      description,
      estimatedValue,
      medium,
      condition,
      dimensions,
      owner: req.userId,
      images: req.body.images || []
    });

    await artwork.save();

    // Add to user's collection
    await require('../models/User').findByIdAndUpdate(
      req.userId,
      { $push: { collection: artwork._id } },
      { new: true }
    );

    res.status(201).json(artwork);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getArtworks = async (req, res) => {
  try {
    const { owner } = req.query;
    const query = owner ? { owner } : {};

    const artworks = await Artwork.find(query).populate('owner');
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id).populate('owner');
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    res.json(artwork);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (artwork.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(artwork, req.body);
    await artwork.save();
    
    res.json(artwork);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    if (artwork.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Artwork.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Artwork deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
