const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Theater = require('../models/Theater');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/theaters - Get all active theaters
router.get('/', async (req, res, next) => {
  try {
    const theaters = await Theater.find({ isActive: true });
    res.json({ theaters });
  } catch (error) {
    next(error);
  }
});

// GET /api/theaters/:id - Get theater by ID or fallback
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        theater: {
          _id: 'demo-theater',
          name: 'Grandé Muthuram Multiplex',
          screens: 4,
          rows: 8,
          seatsPerRow: 16,
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || id === 'demo-theater') {
      const defaultTheater = await Theater.findOne();
      if (defaultTheater) {
        return res.json({ theater: defaultTheater });
      }
      return res.json({
        theater: {
          _id: 'demo-theater',
          name: 'Grandé Muthuram Multiplex',
          screens: 4,
          rows: 8,
          seatsPerRow: 16,
        },
      });
    }

    const theater = await Theater.findById(id);
    if (!theater) {
      const fallback = await Theater.findOne();
      if (fallback) return res.json({ theater: fallback });
      return res.status(404).json({ error: 'Theater not found' });
    }
    res.json({ theater });
  } catch (error) {
    next(error);
  }
});

// PUT /api/theaters/:id - Update theater setup
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, address, screens, rows, seatsPerRow, rowLabels } = req.body;
    let theater;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      theater = await Theater.findOne();
    } else {
      theater = await Theater.findById(req.params.id);
    }

    if (!theater) {
      return res.status(404).json({ error: 'Theater not found' });
    }

    if (name) theater.name = name;
    if (address !== undefined) theater.address = address;
    if (screens) theater.screens = screens;
    if (rows) theater.rows = rows;
    if (seatsPerRow) theater.seatsPerRow = seatsPerRow;
    if (rowLabels) theater.rowLabels = rowLabels;

    await theater.save();
    res.json({ message: 'Theater updated successfully', theater });
  } catch (error) {
    next(error);
  }
});

// PUT /api/theaters/:id/printer-settings - Update printer settings
router.put('/:id/printer-settings', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { printerIp, autoPrint, printerPort } = req.body;
    let theater;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      theater = await Theater.findOne();
    } else {
      theater = await Theater.findById(req.params.id);
    }

    if (!theater) {
      return res.status(404).json({ error: 'Theater not found' });
    }

    theater.settings = theater.settings || {};
    if (printerIp !== undefined) theater.settings.printerIp = printerIp;
    if (autoPrint !== undefined) theater.settings.autoPrint = autoPrint;
    if (printerPort !== undefined) theater.settings.printerPort = printerPort;

    await theater.save();
    res.json({ message: 'Printer settings updated successfully', settings: theater.settings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
