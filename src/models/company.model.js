import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const companySchema = new mongoose.Schema(
  {
    companyId: { type: String, unique: true, required: true },
    companyName: { type: String },
    companyLogo: { type: String },
    email: { type: String },
    domain: { type: String },
    numberOfEmployees: { type: Number },
    gstNumber: { type: String },
    address: { type: String },
    city: { type: String },
    pincode: { type: String },
    country: { type: String },
    contactPerson1: {
      name: { type: String },
      email: { type: String },
      mobileNumber: { type: String },
      designation: { type: String }
    },
    contactPerson2: {
      name: { type: String },
      email: { type: String },
      mobileNumber: { type: String },
      designation: { type: String },
    },
    status: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
companySchema.plugin(toJSON);
companySchema.plugin(paginate);

const Company = mongoose.model('Company', companySchema);

export default Company;
