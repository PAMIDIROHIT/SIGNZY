import { prisma } from '../../db/prismaClient.js';

/**
 * Register a new vendor in the database.
 */
export const registerVendor = async (vendorData) => {
  // Convert features array to JSON string for DB
  const dataToSave = {
    ...vendorData,
    supportedFeatures: JSON.stringify(vendorData.supportedFeatures),
  };
  
  try {
    const vendor = await prisma.vendor.create({
      data: dataToSave,
    });
    
    // Format response to return array instead of string
    return {
      ...vendor,
      supportedFeatures: JSON.parse(vendor.supportedFeatures),
    };
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      const customError = new Error('A vendor with this name already exists. Vendor names must be unique.');
      customError.statusCode = 400;
      throw customError;
    }
    throw error;
  }
};

/**
 * Get all vendors, optionally filtered by capability.
 */
export const getVendors = async (capability) => {
  const query = {};
  if (capability) {
    query.where = { capability };
  }
  
  const vendors = await prisma.vendor.findMany(query);
  
  return vendors.map(v => ({
    ...v,
    supportedFeatures: JSON.parse(v.supportedFeatures),
  }));
};

/**
 * Toggle active status for a vendor.
 */
export const updateVendorStatus = async (id, isActive) => {
  const vendor = await prisma.vendor.update({
    where: { id },
    data: { isActive },
  });
  
  return {
    ...vendor,
    supportedFeatures: JSON.parse(vendor.supportedFeatures),
  };
};
