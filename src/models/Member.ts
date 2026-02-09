import mongoose, { Schema, model, models } from "mongoose";

const MemberSchema = new Schema({
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
  sex: {
    type: String,
    enum: ["Male", "Female"],
    required: true
  },
  churchDept: { 
    type: String, 
    trim: true,
    default: "None"
  },
  // Hierarchy
  cell: { 
    type: String, 
    required: true,
    trim: true 
  },
  seniorCell: { 
    type: String, 
    trim: true 
  },
  team: { 
    type: String, 
    trim: true 
  },
  role: { 
    type: String, 
    enum: ["Member", "BST", "Cell Leader", "Senior Cell Leader", "Team Lead", "Pastor"],
    default: "Member",
    trim: true
  },
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