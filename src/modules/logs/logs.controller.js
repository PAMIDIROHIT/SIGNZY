import { getRoutingLogs } from './logs.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const getRoutingLogsHandler = async (req, res) => {
  const { capability, vendorUsed, status, startDate, endDate, page, limit } = req.query;
  
  const filters = { capability, vendorUsed, status, startDate, endDate };
  const pagination = { page, limit };
  
  const result = await getRoutingLogs(filters, pagination);
  
  sendSuccess(res, 200, result, 'Routing logs fetched successfully');
};
