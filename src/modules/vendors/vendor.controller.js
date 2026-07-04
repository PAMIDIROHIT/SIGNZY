import { registerVendor, getVendors, updateVendorStatus } from './vendor.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export const createVendorHandler = async (req, res) => {
  const vendor = await registerVendor(req.body);
  sendSuccess(res, 201, vendor, 'Vendor registered successfully');
};

export const getVendorsHandler = async (req, res) => {
  const { capability } = req.query;
  const vendors = await getVendors(capability);
  sendSuccess(res, 200, vendors, 'Vendors fetched successfully');
};

export const updateVendorStatusHandler = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const vendor = await updateVendorStatus(id, isActive);
  sendSuccess(res, 200, vendor, 'Vendor status updated successfully');
};
