import { getLiveMetrics } from './metrics.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const getVendorMetricsHandler = async (req, res) => {
  const { capability } = req.query;
  const metrics = await getLiveMetrics(capability);
  sendSuccess(res, 200, metrics, 'Vendor metrics fetched successfully');
};
