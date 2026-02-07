import mongoose, { Schema, model, models } from "mongoose";

const MemberSchema = new Schema({
  // 1. Core Identity
  name: { 
    type: String, 
    required: [true, "Please provide a full name"], 
    trim: true 
  },
  
  // 2. Church Data (FLEXIBLE NOW)
  churchDept: { 
    type: String, 
    trim: true,
    default: "None"
  },
  cell: { 
    type: String, 
    required: true,
    trim: true 
    // REMOVED 'enum' to allow new cells like "Dominion" or "Healing"
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

  // 4. Attendance Log (Sunday/Wednesday)
  attendance: [{
    date: { type: Date, default: Date.now },
    serviceType: { type: String, required: true }, // "Sunday", "Mid-Week"
    markedBy: { type: String } 
  }],

  createdAt: { type: Date, default: Date.now },
});

// Prevent model recompilation error
const Member = models.Member || model("Member", MemberSchema);

export default Member;