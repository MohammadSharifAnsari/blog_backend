import userModel from "../model/user.schema.js";
import postModel from "../model/post.schema.js"
import AppError from "../utils/error.utils.js";
import commentModel from "../model/comment.schema.js"
import categoryModel from "../model/category.schema.js";
import tagModel from "../model/tag.schema.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";
import fs from 'fs/promises';
import sendEmail from "../utils/sendMail.utils.js";
import crypto from "crypto"
import passwordUpdated from "../mail/passwordUpdate.js";
import takeNewPassword from "../mail/takePassword.js";
import mongoose from "mongoose";


export const getAllUsers = async (req, res, next) => {
  try {
    // Fetch all users, exclude sensitive fields
    const users = await userModel
      .find({})
      .select(
        "name email role bio avatar bookmarks posts comments newsletterSubscribed isActive createdAt updatedAt"
      )
      .populate([
        {
          path: "posts",
          select: "title _id",
          match: { isPublished: true }, // only show published posts
        },
        {
          path: "comments",
          select: "content _id post",
          populate: { path: "post", select: "title" },
        },
        {
          path: "bookmarks",
          select: "title _id",
        },
      ])
      .sort({ createdAt: -1 }) // newest first
      .lean();

    // Get total count
    const totalUsers = await userModel.countDocuments();

    // Success response
    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      data: users,
    });
  } catch (error) {
    return next(new AppError("Failed to fetch users", 500));
  }
};

export const getUserById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find user by ID, exclude sensitive fields
    const user = await userModel
      .findById(id)
      .select(
        "name email role bio avatar posts comments bookmarks newsletterSubscribed isActive createdAt updatedAt"
      )
      .populate([
        {
          path: "posts",
          select: "title _id isPublished",
          match: { isPublished: true }, // only published posts
        },
        {
          path: "comments",
          select: "content _id post createdAt",
          populate: {
            path: "post",
            select: "title _id",
          },
        },
        {
          path: "bookmarks",
          select: "title _id avatar",
        },
      ])
      .lean();

    // If user not found
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Success response
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(new AppError("Failed to fetch user", 500));
  }
};

export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

try {

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
  
      return next(new AppError("Invalid user ID", 400));
    }


    // Find user with populated posts and comments
    const user = await userModel
      .findById(id)
      .populate([
        { path: "posts", select: "_id" },
        { path: "comments", select: "_id post", populate: { path: "post", select: "_id" } },
      ])
      .lean();


    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // 1. Delete all user's comments and clean post references
    for (const comment of user.comments || []) {
      await commentModel.findByIdAndDelete(comment._id);
      await postModel.findByIdAndUpdate(
        comment.post._id,
        { $pull: { comments: comment._id } }
      );
    }

// 2. Delete all user's posts
for (const post of user.posts || []) {
  await postModel.findByIdAndDelete(post._id);
}


// 3. Remove user from likes in any posts they liked
await postModel.updateMany(
  { likes: id },
  { $pull: { likes: id } }
);


    // 4. Delete the user document
    await userModel.findByIdAndDelete(id);

    // Success response
    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(new AppError("Failed to delete user", 500));
  }
};
export const getAllComments = async (req, res, next) => {
  try {
    // Fetch all comments with population
    console.log("[blog_backend/controller/Admin.controller.js]:start get all comments")
    const comments = await commentModel
      .find({})
      .populate([
        {
          path: "post",
          select: "title _id isPublished",
          match: { isPublished: true }, // Only show published posts
        },
        {
          path: "user",
          select: "name email _id",
        },
      ])
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    // Filter out comments where post was not found (e.g., deleted post)
    const validComments = comments.filter(comment => comment.post !== null);

    // Success response
    res.status(200).json({
      success: true,
      count: validComments.length,
      data: validComments,
    });
  } catch (error) {
    return next(new AppError("Failed to fetch comments", 500));
  }
};

export const createCategory = async (req, res, next) => {
  const { name, description = "" } = req.body;

  try {
    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return next(new AppError("Category name is required and cannot be empty", 400));
    }

    if (name.trim().length > 100) {
      return next(new AppError("Category name cannot exceed 100 characters", 400));
    }

    const trimmedName = name.trim();

    // Case-insensitive check for existing category
    const existingCategory = await categoryModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });

    if (existingCategory) {
      return next(new AppError("Category with this name already exists (case-insensitive)", 409));
    }

    // Create category
    const newCategory = await categoryModel.create({
      name: trimmedName,
      description: description.trim(),
    });

    // Success response
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        _id: newCategory._id,
        name: newCategory.name,
        description: newCategory.description,
        createdAt: newCategory.createdAt,
      },
    });
  } catch (error) {
    // Handle any other DB errors (e.g., unique constraint for exact match)
    if (error.code === 11000) {
      return next(new AppError("Category name already exists", 409));
    }
    return next(new AppError("Failed to create category", 500));
  }
};

export const updateCategory = async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid category ID", 400));
    }

    // 2. Find existing category
    const existingCategory = await categoryModel.findById(id).lean();

    if (!existingCategory) {
      return next(new AppError("Category not found", 404));
    }

    // 3. Prepare update data (only if provided)
    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return next(new AppError("Category name is required and cannot be empty if provided", 400));
      }
      if (name.trim().length > 100) {
        return next(new AppError("Category name cannot exceed 100 characters", 400));
      }
      const trimmedName = name.trim();

      // Case-insensitive check for duplicate (exclude current category)
      const duplicate = await categoryModel.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        _id: { $ne: id }
      });

      if (duplicate) {
        return next(new AppError("Category with this name already exists (case-insensitive)", 409));
      }

      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    // 4. If no data to update
    if (Object.keys(updateData).length === 0) {
      return next(new AppError("No valid fields provided to update", 400));
    }

    // 5. Update category
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("name description createdAt updatedAt").lean();

    // 6. Success response
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    // Handle duplicate name (unique constraint)
    if (error.code === 11000) {
      return next(new AppError("Category name already exists", 409));
    }
    return next(new AppError("Failed to update category", 500));
  }
};


export const deleteCategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid category ID", 400));
    }

    // 2. Find existing category
    const category = await categoryModel.findById(id).lean();

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // 3. Remove category reference from all posts
    await postModel.updateMany(
      { categories: id },
      { $pull: { categories: id } }
    );

    // 4. Delete the category
    await categoryModel.findByIdAndDelete(id);

    // 5. Success response
    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(new AppError("Failed to delete category", 500));
  }
};


export const createTag = async (req, res, next) => {

  const { name, description = "" } = req.body;

  try {
    // Validate required fields\

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return next(new AppError("Tag name is required and cannot be empty", 400));
    }
 
    
    if (name.trim().length > 50) {
      return next(new AppError("Tag name cannot exceed 50 characters", 400));
    }

    
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    
    // Case-insensitive check for existing tag
    const existingTag = await tagModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });
 
    
    if (existingTag) {
      return next(new AppError("Tag with this name already exists (case-insensitive)", 409));
    }
 
    
    // Create tag
    const newTag = await tagModel.create({
      name: trimmedName,
      description: trimmedDescription, // Optional, defaults to "" if not provided
    });

    // Success response
    res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: {
        _id: newTag._id,
        name: newTag.name,
        description: newTag.description,
        createdAt: newTag.createdAt,
      },
    });
  } catch (error) {
    // Handle duplicate name (unique constraint)
    if (error.code === 11000) {
      return next(new AppError("Tag name already exists", 409));
    }
    return next(new AppError("Failed to create tag", 500));
  }
};


export const updateTag = async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid tag ID", 400));
    }

    // 2. Find existing tag
    const existingTag = await tagModel.findById(id).lean();

    if (!existingTag) {
      return next(new AppError("Tag not found", 404));
    }

    // 3. Prepare update data (only if provided)
    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return next(new AppError("Tag name is required and cannot be empty if provided", 400));
      }
      if (name.trim().length > 50) {
        return next(new AppError("Tag name cannot exceed 50 characters", 400));
      }
      const trimmedName = name.trim();

      // Case-insensitive check for duplicate (exclude current tag)
      const duplicate = await tagModel.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        _id: { $ne: id }
      });

      if (duplicate) {
        return next(new AppError("Tag with this name already exists (case-insensitive)", 409));
      }

      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    // 4. If no data to update
    if (Object.keys(updateData).length === 0) {
      return next(new AppError("No valid fields provided to update", 400));
    }

    // 5. Update tag
    const updatedTag = await tagModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("name description createdAt updatedAt").lean();

    // 6. Success response
    res.status(200).json({
      success: true,
      message: "Tag updated successfully",
      data: updatedTag,
    });
  } catch (error) {
    // Handle duplicate name (unique constraint)
    if (error.code === 11000) {
      return next(new AppError("Tag name already exists", 409));
    }
    return next(new AppError("Failed to update tag", 500));
  }
};


/**
 * 5. DELETE /api/tags/:id → deleteTag(req, res)
 * Admin only — delete tag and remove references from all posts
 */
export const deleteTag = async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid tag ID", 400));
    }

    // 2. Find existing tag
    const tag = await tagModel.findById(id).lean();

    if (!tag) {
      return next(new AppError("Tag not found", 404));
    }

    // 3. Remove tag reference from all posts
    await postModel.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );

    // 4. Delete the tag
    await tagModel.findByIdAndDelete(id);

    // 5. Success response
    res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(new AppError("Failed to delete tag", 500));
  }
};