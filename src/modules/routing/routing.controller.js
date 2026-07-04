import { routeRequest } from './routing.service.js';
import { sendRoutingSuccess } from '../../utils/apiResponse.js';

export const routeRequestHandler = async (req, res) => {
  const result = await routeRequest(req.body);
  
  sendRoutingSuccess(
    res, 
    result.vendorUsed, 
    result.routingReason, 
    result.latencyMs, 
    result.cost, 
    result.response
  );
};
