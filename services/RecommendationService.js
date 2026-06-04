const { Track, PlayHistory } = require('../models');
const { Op } = require('sequelize');

class RecommendationService {
  /**
   * Get personalized track recommendations for a user.
   * Algorithm:
   *   1. Find recent play history (up to 40 plays).
   *   2. Extract the set of artists the user has been listening to.
   *   3. Find tracks by those artists that the user has NOT yet played.
   *   4. If not enough results, fall back to most-played tracks globally.
   * @param {number|null} userId
   * @returns {Promise<Track[]>} Array of up to 10 tracks
   */
  static async getRecommendedTracks(userId) {
    const LIMIT = 12;

    try {
      if (userId) {
        // Step 1: Fetch recent play history
        const recentPlays = await PlayHistory.findAll({
          where: { userId },
          order: [['playedAt', 'DESC']],
          limit: 40
        });

        if (recentPlays.length > 0) {
          // Step 2: Resolve which tracks were played and their artists
          const playedTrackIds = [...new Set(recentPlays.map(p => p.trackId))];
          const playedTracks = await Track.findAll({
            where: { id: playedTrackIds }
          });

          // Build a frequency map of artists
          const artistFrequency = {};
          playedTracks.forEach(t => {
            if (t.artist) {
              artistFrequency[t.artist] = (artistFrequency[t.artist] || 0) + 1;
            }
          });

          // Sort artists by how often user listens to them (most listened first)
          const favoriteArtists = Object.keys(artistFrequency)
            .sort((a, b) => artistFrequency[b] - artistFrequency[a])
            .slice(0, 5); // top 5 artists

          // Step 3: Find tracks by those artists that user has NOT played
          const recommendations = await Track.findAll({
            where: {
              artist: { [Op.in]: favoriteArtists },
              id: { [Op.notIn]: playedTrackIds },
              type: 'song'
            },
            order: [['playCount', 'DESC']],
            limit: LIMIT
          });

          if (recommendations.length >= 4) {
            return recommendations;
          }

          // Partial results — pad with popular tracks user hasn't heard
          const extraNeeded = LIMIT - recommendations.length;
          const alreadyFoundIds = recommendations.map(r => r.id);
          const excludeIds = [...playedTrackIds, ...alreadyFoundIds];

          const popularFallback = await Track.findAll({
            where: {
              id: { [Op.notIn]: excludeIds },
              type: 'song'
            },
            order: [['playCount', 'DESC']],
            limit: extraNeeded
          });

          return [...recommendations, ...popularFallback];
        }
      }

      // Fallback: no play history — return most played songs globally
      const popular = await Track.findAll({
        where: { type: 'song' },
        order: [['playCount', 'DESC'], ['createdAt', 'DESC']],
        limit: LIMIT
      });

      return popular;
    } catch (err) {
      console.error('[RecommendationService] Error:', err);
      // Final fallback: newest tracks
      return await Track.findAll({
        where: { type: 'song' },
        order: [['createdAt', 'DESC']],
        limit: LIMIT
      });
    }
  }
}

module.exports = RecommendationService;
