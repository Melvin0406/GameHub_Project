// backend/src/controllers/streamController.js
const streamService = require('../services/streamService');

exports.goLive = async (req, res, next) => {
    try {
        const userId = req.user.id; // De authMiddleware
        const { title, gameName } = req.body;
        const result = await streamService.goLive(userId, { title, gameName });
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.goOffline = async (req, res, next) => {
    try {
        const userId = req.user.id; // De authMiddleware
        const result = await streamService.goOffline(userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.listActiveStreams = async (req, res, next) => {
    try {
        const streams = await streamService.getActiveStreams();
        res.json(streams);
    } catch (error) {
        next(error);
    }
};

exports.getMyLiveStatus = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const status = await streamService.getLiveStreamStatusByUserId(userId);
        res.json(status);
    } catch (error) {
        next(error);
    }
};