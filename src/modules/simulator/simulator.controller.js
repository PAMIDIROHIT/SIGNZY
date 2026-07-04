/**
 * src/modules/simulator/simulator.controller.js
 * Simulates third-party vendor APIs (like KYC, OCR) with configurable
 * failure rates, latency, and downtime.
 */

// Helper to simulate delay with jitter
const delay = (ms) => {
  // Add +/- 20% jitter
  const jitter = ms * 0.2;
  const actualLatency = ms + (Math.random() * jitter * 2) - jitter;
  return new Promise((resolve) => setTimeout(resolve, actualLatency > 0 ? actualLatency : 0));
};

export const simulateVendorRequest = async (req, res) => {
  const { vendorName } = req.params;
  const capability = req.query.capability || 'UNKNOWN';
  
  // Parse configurations from query
  const failRate = parseFloat(req.query.failRate) || 0;
  const latencyMs = parseInt(req.query.latencyMs, 10) || 100;
  const isDown = req.query.isDown === 'true';
  
  // Simulate network delay
  await delay(latencyMs);
  
  // Simulate forced downtime
  if (isDown) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: `${vendorName} is currently down.`
    });
  }
  
  // Simulate random failure
  if (Math.random() < failRate) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: `${vendorName} encountered an unexpected error.`
    });
  }
  
  // Return mock successful payload based on capability
  let mockData = {};
  
  if (capability === 'PAN_VERIFICATION') {
    mockData = {
      panStatus: 'VALID',
      nameMatch: true,
      verifiedBy: vendorName
    };
  } else if (capability === 'OCR') {
    mockData = {
      documentType: 'ID_CARD',
      extractedText: 'Sample extracted text from document',
      confidenceScore: 0.95,
      processedBy: vendorName
    };
  } else {
    mockData = {
      status: 'SUCCESS',
      handledBy: vendorName
    };
  }

  res.status(200).json(mockData);
};
