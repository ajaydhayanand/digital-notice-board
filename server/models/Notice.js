const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    publishAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notice", noticeSchema);
