// models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true 
    },
      teacher: { type: mongoose.Schema.Types.ObjectId,
        ref: 'Teachers',
        required: false, },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    type:{ 
        type: String, 
        enum: ['free', 'paid'], 
        required: false 
      },
    availableseats:{
        type: String,
        required: false
    },
    level: { 
        type: String, 
        enum: ['Beginner', 'Intermediate', 'Advanced'], 
        required: false 
      },
    image: {
        type: String,
        required: false
    },
    startDate: {
        type: Date,
        required: false
    },
    startTime: {
        type: String,
        required: false
    },
    eventmode:{
        type: String,
        required: false
    },
    location: {
        type: String,
        required:false
    },
    details: {
        type: String,
        required: false
       
    },

whoitsfor:{
    type: String,
    required: false
},
whoitsnotfor:{
    type: String,
    required: false
},
howItWillHelp:{
    type: String,
    required: false
},
howItWillnotHelp:{
    type: String,
    required: false
},
   password: { type: String,default:""},
    meeting_number:{ type: String,default:""},
    status: {
        type: Boolean,
        default: false,
      },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
    