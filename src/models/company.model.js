import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const companySchema = new mongoose.Schema({
  companyId: { type: String, unique: true, required: true },
  companyName: { type: String },
  consultPersonName: { type: String, required: true },
  email: { type: String },
  mobile: { type: String },
  designation: { type: String },
  domain: { type: String },
  numberOfEmployees: { type: Number },
  gstNumber: { type: String },
  address: { type: String },
  city: { type: String },
  pincode: { type: String },
  country: { type: String },
  status:{type:Boolean,default:true},
}, {
  timestamps: true
});

// add plugin that converts mongoose to json
companySchema.plugin(toJSON);
companySchema.plugin(paginate);

const Company = mongoose.model('Company', companySchema);

export default Company; 