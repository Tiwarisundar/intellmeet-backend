const mongoose = require("mongoose");

const meetingSummarySchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      unique: true,
    },

    transcript: {
      type: String,
      default: "",
    },

    summary: {
      type: String,
      default: "",
    },

    keyPoints: [
      {
        type: String,
      },
    ],
  
    actionItems: [
     {
      task: {
      type: String,
      required: true,
    },

    // AI se aaya hua naam
    assigneeName: {
      type: String,
      default: "",
    },

    // Actual User ID (baad me map karenge)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
],
},
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MeetingSummary",
  meetingSummarySchema
);