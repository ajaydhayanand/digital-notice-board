const mongoose = require("mongoose");
const Notice = require("../models/Notice");

const createNotice = async (req, res) => {
  try {
    const { title, description, category, createdBy } = req.body;

    const notice = await Notice.create({
      title,
      description,
      category,
      createdBy,
    });

    return res.status(201).json(notice);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to create notice" });
  }
};

const getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    return res.status(200).json(notices);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notices" });
  }
};

const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notice ID" });
    }

    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    return res.status(200).json(notice);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notice" });
  }
};

const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notice ID" });
    }

    const { title, description, category, createdBy } = req.body;

    const updatedNotice = await Notice.findByIdAndUpdate(
      id,
      { title, description, category, createdBy },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    return res.status(200).json(updatedNotice);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update notice" });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notice ID" });
    }

    const deletedNotice = await Notice.findByIdAndDelete(id);

    if (!deletedNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete notice" });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
