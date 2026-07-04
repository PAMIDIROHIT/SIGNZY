/**
 * src/utils/apiResponse.js
 * Standardized success and error response structures.
 */

/**
 * Send a success response.
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Payload to send
 * @param {string} message - Optional message
 */
export const sendSuccess = (res, statusCode, data = {}, message = 'Success') => {
  res.status(statusCode).json({
    status: 'SUCCESS',
    message,
    data,
  });
};

/**
 * Standard envelope for vendor routing response specifically.
 * @param {Object} res - Express response object
 * @param {string} vendorUsed - Name of the selected vendor
 * @param {string} routingReason - Why this vendor was picked
 * @param {number} latencyMs - How long it took
 * @param {number} cost - Cost of request
 * @param {Object} responseData - The actual capability payload
 */
export const sendRoutingSuccess = (res, vendorUsed, routingReason, latencyMs, cost, responseData) => {
  res.status(200).json({
    status: 'SUCCESS',
    vendorUsed,
    routingReason,
    latencyMs,
    cost,
    response: responseData
  });
};

/**
 * Send an error response.
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error context
 */
export const sendError = (res, statusCode, message, details = null) => {
  res.status(statusCode).json({
    status: 'FAILURE',
    message,
    details,
  });
};
