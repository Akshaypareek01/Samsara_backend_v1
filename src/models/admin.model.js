import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  status:{
    type:Boolean,
    default:true
  },
}, {
  timestamps: true
});

// add plugin that converts mongoose to json
adminSchema.plugin(toJSON);
adminSchema.plugin(paginate);

const Admin = mongoose.model('Admin', adminSchema);

export default Admin; 