import { getAccountUsageStats, resetAccountStatus, resetAllAccountStatuses } from '../services/zoomService.js';

/**
 * Get account usage statistics
 * @route GET /api/v1/zoom/account-stats
 * @access Public (you may want to add authentication)
 */
export const getAccountStats = async (req, res) => {
  try {
    const stats = getAccountUsageStats();
    
    res.json({
      success: true,
      data: {
        accounts: stats,
        summary: {
          totalAccounts: Object.keys(stats).length,
          activeAccounts: Object.values(stats).filter(acc => acc.isActive).length,
          totalActiveMeetings: Object.values(stats).reduce((sum, acc) => sum + acc.activeMeetings, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reset specific account status
 * @route POST /api/v1/zoom/reset-account/:accountId
 * @access Public (you may want to add authentication)
 */
export const resetAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    resetAccountStatus(accountId);
    
    res.json({
      success: true,
      message: `Account ${accountId} status reset successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reset all account statuses
 * @route POST /api/v1/zoom/reset-all-accounts
 * @access Public (you may want to add authentication)
 */
export const resetAllAccounts = async (req, res) => {
  try {
    resetAllAccountStatuses();
    
    res.json({
      success: true,
      message: 'All account statuses reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Health check for Zoom service
 * @route GET /api/v1/zoom/health
 * @access Public
 */
export const zoomHealthCheck = async (req, res) => {
  try {
    const stats = getAccountUsageStats();
    const activeAccounts = Object.values(stats).filter(acc => acc.isActive);
    
    const healthStatus = {
      status: activeAccounts.length > 0 ? 'healthy' : 'unhealthy',
      activeAccounts: activeAccounts.length,
      totalAccounts: Object.keys(stats).length,
      timestamp: new Date().toISOString()
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        status: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }
};
