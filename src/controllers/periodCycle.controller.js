import catchAsync from '../utils/catchAsync.js';
import { periodCycleService } from '../services/periodCycle.service.js';
import pick from '../utils/pick.js';

/**
 * Period Cycle Controller - Handles all period cycle API endpoints
 */
class PeriodCycleController {
  /**
   * Start a new period cycle
   * POST /api/v1/period-cycles/start
   * Body: { date?: Date } - Optional start date (defaults to current date)
   */
  startNewCycle = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { date } = req.body;
    
    const newCycle = await periodCycleService.startNewCycle(userId, date);
    
    res.status(201).json({
      status: 'success',
      data: {
        cycle: newCycle
      },
      message: 'New period cycle started successfully'
    });
  });

  /**
   * Complete an active cycle
   * PUT /api/v1/period-cycles/:cycleId/complete
   * Body: { date?: Date } - Optional end date (defaults to current date)
   */
  completeCycle = catchAsync(async (req, res) => {
    const { cycleId } = req.params;
    const userId = req.user.id;
    const { date } = req.body;
    
    const completedCycle = await periodCycleService.completeCycle(cycleId, userId, date);
    
    res.status(200).json({
      status: 'success',
      data: {
        cycle: completedCycle
      },
      message: 'Cycle completed successfully'
    });
  });

  /**
   * Add or update daily log
   * POST /api/v1/period-cycles/:cycleId/daily-log
   */
  updateDailyLog = catchAsync(async (req, res) => {
    const { cycleId } = req.params;
    const userId = req.user.id;
    const logData = pick(req.body, [
      'date', 'flowIntensity', 'crampingIntensity', 'painLevel', 
      'energyPattern', 'restNeeded', 'symptoms', 'cravings',
      'medicationTaken', 'supplementTaken', 'exercise', 'discharge',
      'sexualActivity', 'pregnancyTest', 'notes'
    ]);
    
    const updatedCycle = await periodCycleService.updateDailyLog(cycleId, userId, logData);
    
    res.status(200).json({
      status: 'success',
      data: {
        cycle: updatedCycle
      },
      message: 'Daily log updated successfully'
    });
  });

  /**
   * Get current active cycle
   * GET /api/v1/period-cycles/current
   */
  getCurrentCycle = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const currentCycle = await periodCycleService.getCurrentActiveCycle(userId);
    
    if (!currentCycle) {
      return res.status(200).json({
        status: 'success',
        data: {
          cycle: null
        },
        message: 'No active cycle found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        cycle: currentCycle
      }
    });
  });

  /**
   * Get cycle history
   * GET /api/v1/period-cycles/history
   */
  getCycleHistory = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { limit = 6 } = req.query;
    
    const cycleHistory = await periodCycleService.getUserCycleHistory(userId, parseInt(limit));
    
    res.status(200).json({
      status: 'success',
      data: {
        cycles: cycleHistory,
        total: cycleHistory.length
      }
    });
  });

  /**
   * Get upcoming cycle predictions
   * GET /api/v1/period-cycles/predictions
   */
  getPredictions = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const predictions = await periodCycleService.getUpcomingCyclePredictions(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        predictions
      }
    });
  });

  /**
   * Get cycle analytics
   * GET /api/v1/period-cycles/analytics
   */
  getAnalytics = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const analytics = await periodCycleService.getCycleAnalytics(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        analytics
      }
    });
  });

  /**
   * Get specific cycle by ID
   * GET /api/v1/period-cycles/:cycleId
   */
  getCycleById = catchAsync(async (req, res) => {
    const { cycleId } = req.params;
    const userId = req.user.id;
    
    const cycle = await periodCycleService.getCycleById(cycleId, userId);
    
    if (!cycle) {
      return res.status(404).json({
        status: 'error',
        message: 'Cycle not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        cycle
      }
    });
  });

  /**
   * Update cycle notes
   * PUT /api/v1/period-cycles/:cycleId/notes
   */
  updateCycleNotes = catchAsync(async (req, res) => {
    const { cycleId } = req.params;
    const userId = req.user.id;
    const { cycleNotes } = req.body;
    
    const updatedCycle = await periodCycleService.updateCycleNotes(cycleId, userId, cycleNotes);
    
    res.status(200).json({
      status: 'success',
      data: {
        cycle: updatedCycle
      },
      message: 'Cycle notes updated successfully'
    });
  });

  /**
   * Delete a cycle (admin only or user's own cycle)
   * DELETE /api/v1/period-cycles/:cycleId
   */
  deleteCycle = catchAsync(async (req, res) => {
    const { cycleId } = req.params;
    const userId = req.user.id;
    
    await periodCycleService.deleteCycle(cycleId, userId);
    
    res.status(200).json({
      status: 'success',
      message: 'Cycle deleted successfully'
    });
  });
}

export const periodCycleController = new PeriodCycleController();
