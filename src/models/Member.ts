import mongoose, { Schema, model, models } from "mongoose";

const MemberSchema = new Schema({
  // 1. Core Identity
  name: { 
    type: String, 
    required: [true, "Please provide a full name"], 
    trim: true 
  },
  
  phone: { 
    type: String, 
    required: [true, "Phone number is required"], 
    unique: true,
    trim: true 
  },
  churchDept: { 
    type: String, 
    trim: true,
    default: "None"
  },
  cell: { 
    type: String, 
    required: true,
    trim: true 
   
  },
  role: { 
    type: String, 
    default: "Base Member",
    trim: true
  },

  // 3. School Data
  schoolDept: { 
    type: String, 
    uppercase: true, 
    trim: true 
  },
  level: { 
    type: String, 
    required: true 
  },


  attendance: [{
    date: { type: Date, default: Date.now },
    serviceType: { type: String, required: true }, 
    markedBy: { type: String } 
  }],

  createdAt: { type: Date, default: Date.now },
});


const Member = models.Member || model("Member", MemberSchema);

export default Member;