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
  // Lifecycle: a visitor starts as a FirstTimer and is promoted to Member
  // (assigned a cell) once they join.
  status: {
    type: String,
    enum: ["FirstTimer", "Member"],
    default: "Member"
  },
  // Hierarchy. Optional at the schema level (first-timers have no cell yet);
  // "members must have a cell" is enforced in the API route, which behaves
  // correctly on both create and update (unlike cross-field schema validators).
  cell: {
    type: String,
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
    trim: true
  },
  // First-timer follow-up details (optional; captured at first visit).
  email: { type: String, trim: true, lowercase: true },
  birthday: { type: String, trim: true },
  address: { type: String, trim: true },
  invitedBy: { type: String, trim: true },
  visitDate: { type: String, trim: true },
  isMember: { type: String, trim: true },
  attendance: [{
    date: { type: Date, default: Date.now },
    serviceType: { type: String, required: true }, 
    markedBy: { type: String } 
  }],
  createdAt: { type: Date, default: Date.now },
});

const Member = models.Member || model("Member", MemberSchema);
export default Member;