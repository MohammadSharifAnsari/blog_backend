import postModel from "../model/post.schema.js";
import fs from "fs/promises";
import categoryModel from "../model/category.schema.js";
import tagModel from "../model/tag.schema.js";
import cloudinary from "cloudinary";
import AppError from "../utils/error.utils.js";
import commentModel from "../model/comment.schema.js"; 
import userModel from "../model/user.schema.js";
import mongoose from "mongoose";

export const getAllCategories = async (req, res, next) => {
  try {
    // Fetch all categories, sorted alphabetically by name
    const categories = await categoryModel
      .find({})
      .select("name description createdAt")
      .sort({ name: 1 })  // Ascending order
      .lean();

    // Success response
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    // Pass any unexpected error to global error middleware
    return next(AppError(error.message,404));
  }
};

export const getCategoryById = async (req, res, next) => {
  const { id } = req.params;

  try {
  // 1. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid category ID", 400));
    }

    // 2. Find category by ID
    const category = await categoryModel
      .findById(id)
      .select("name description createdAt updatedAt")
      .lean();

    // 3. Not found → trigger AppError with 404
    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // 4. Success response
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    // For unexpected errors (e.g. DB crash), pass with 500
    // But if it's already an AppError, preserve status
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError("Server error while fetching category", 500));
  }
};


