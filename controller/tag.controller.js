import tagModel from "../model/tag.schema.js";
import AppError from "../utils/error.utils.js";
import mongoose from "mongoose";

export const getAllTags = async (req, res, next) => {
  try {
    // Fetch all tags, sorted alphabetically by name
    const tags = await tagModel
      .find({})
      .select("name createdAt")
      .sort({ name: 1 })  // A → Z
      .lean();

    // If no tags exist (optional: you can return 404 or just empty array)
    // Here we return empty array as it's valid
    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags,
    });
  } catch (error) {
    // Pass unexpected errors to global error middleware
    return next(new AppError(error.message || "Failed to fetch tags", 500));
  }
};
export const getTagById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid tag ID", 400));
    }

    // 2. Find tag by ID
    const tag = await tagModel
      .findById(id)
      .select("name createdAt updatedAt")
      .lean();

    // 3. Not found → trigger AppError with 404
    if (!tag) {
      return next(new AppError("Tag not found", 404));
    }

    // 4. Success response
    res.status(200).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    // Handle unexpected errors (e.g. DB connection)
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError("Server error while fetching tag", 500));
  }
};
