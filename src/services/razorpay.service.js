import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

class RazorpayService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.secretKey,
    });
  }

  /**
   * Create a Razorpay order
   * @param {Object} orderData - Order details
   * @param {number} orderData.amount - Amount in paise
   * @param {string} orderData.currency - Currency code
   * @param {string} orderData.receipt - Receipt ID
   * @param {Object} orderData.notes - Additional notes
   * @returns {Promise<Object>} Razorpay order
   */
  async createOrder(orderData) {
    try {
      const options = {
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt,
        notes: orderData.notes || {},
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to create Razorpay order: ${error.message}`
      );
    }
  }

  /**
   * Verify payment signature
   * @param {string} razorpayOrderId - Razorpay order ID
   * @param {string} razorpayPaymentId - Razorpay payment ID
   * @param {string} razorpaySignature - Razorpay signature
   * @returns {boolean} Whether signature is valid
   */
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.secretKey)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpaySignature;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to verify payment signature: ${error.message}`
      );
    }
  }

  /**
   * Fetch payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async fetchPayment(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to fetch payment: ${error.message}`
      );
    }
  }

  /**
   * Fetch order details
   * @param {string} orderId - Razorpay order ID
   * @returns {Promise<Object>} Order details
   */
  async fetchOrder(orderId) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to fetch order: ${error.message}`
      );
    }
  }

  /**
   * Create a refund
   * @param {Object} refundData - Refund details
   * @param {string} refundData.paymentId - Razorpay payment ID
   * @param {number} refundData.amount - Refund amount in paise
   * @param {string} refundData.notes - Refund notes
   * @returns {Promise<Object>} Refund details
   */
  async createRefund(refundData) {
    try {
      const options = {
        payment_id: refundData.paymentId,
        amount: refundData.amount,
        notes: refundData.notes || {},
      };

      const refund = await this.razorpay.payments.refund(refundData.paymentId, options);
      return refund;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to create refund: ${error.message}`
      );
    }
  }

  /**
   * Fetch refund details
   * @param {string} refundId - Razorpay refund ID
   * @returns {Promise<Object>} Refund details
   */
  async fetchRefund(refundId) {
    try {
      const refund = await this.razorpay.refunds.fetch(refundId);
      return refund;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to fetch refund: ${error.message}`
      );
    }
  }

  /**
   * Create a plan for recurring payments
   * @param {Object} planData - Plan details
   * @param {string} planData.period - Billing period (monthly, yearly, etc.)
   * @param {number} planData.interval - Billing interval
   * @param {Object} planData.item - Item details
   * @returns {Promise<Object>} Razorpay plan
   */
  async createPlan(planData) {
    try {
      const options = {
        period: planData.period,
        interval: planData.interval,
        item: {
          name: planData.item.name,
          amount: planData.item.amount,
          currency: planData.item.currency || 'INR',
          description: planData.item.description,
        },
        notes: planData.notes || {},
      };

      const plan = await this.razorpay.plans.create(options);
      return plan;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to create plan: ${error.message}`
      );
    }
  }

  /**
   * Create a subscription
   * @param {Object} subscriptionData - Subscription details
   * @param {string} subscriptionData.planId - Razorpay plan ID
   * @param {number} subscriptionData.customerNotify - Customer notification flag
   * @param {number} subscriptionData.quantity - Quantity
   * @param {Object} subscriptionData.notes - Additional notes
   * @returns {Promise<Object>} Razorpay subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const options = {
        plan_id: subscriptionData.planId,
        customer_notify: subscriptionData.customerNotify || 1,
        quantity: subscriptionData.quantity || 1,
        notes: subscriptionData.notes || {},
      };

      const subscription = await this.razorpay.subscriptions.create(options);
      return subscription;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to create subscription: ${error.message}`
      );
    }
  }

  /**
   * Fetch subscription details
   * @param {string} subscriptionId - Razorpay subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  async fetchSubscription(subscriptionId) {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to fetch subscription: ${error.message}`
      );
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Razorpay subscription ID
   * @param {string} cancelAtCycleEnd - Cancel at cycle end flag
   * @returns {Promise<Object>} Cancelled subscription
   */
  async cancelSubscription(subscriptionId, cancelAtCycleEnd = 0) {
    try {
      const subscription = await this.razorpay.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: cancelAtCycleEnd,
      });
      return subscription;
    } catch (error) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to cancel subscription: ${error.message}`
      );
    }
  }

  /**
   * Convert amount to paise (for Razorpay)
   * @param {number} amount - Amount in rupees
   * @returns {number} Amount in paise
   */
  convertToPaise(amount) {
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from paise to rupees
   * @param {number} amount - Amount in paise
   * @returns {number} Amount in rupees
   */
  convertFromPaise(amount) {
    return amount / 100;
  }

  /**
   * Generate a unique receipt ID
   * @param {string} prefix - Receipt prefix
   * @returns {string} Unique receipt ID
   */
  generateReceiptId(prefix = 'RCP') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }
}

export default new RazorpayService();
