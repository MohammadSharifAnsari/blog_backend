import postModel from "../model/post.schema.js";
import fs from "fs/promises";
import categoryModel from "../model/category.schema.js";
import tagModel from "../model/tag.schema.js";
import cloudinary from "cloudinary";
import AppError from "../utils/error.utils.js";
import commentModel from "../model/comment.schema.js"; 
import userModel from "../model/user.schema.js";
import mongoose from "mongoose";


export const getCommentById = async (req, res) => {
  const { id } = req.params;
  const user = req.body.user; // injected by isLoggedIn middleware

  try {
    // 1. Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    // 2. Find comment with population
    const comment = await commentModel
      .findById(id)
      .populate([
        { path: "post", select: "title _id" },
        { path: "user", select: "name email avatar" },
      ])
      .lean();

    // 3. Comment not found
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // 4. Authorization: Only owner or admin
    // console.log(`[blog_backend/controller/comment.controller.js]:comment.user>>${Object.keys(comment.user)}`)
    // console.log(`[blog_backend/controller/comment.controller.js]:user>>${Object.keys(user)}`)
    // console.log(`[blog_backend/controller/comment.controller.js]:comment.user._id>>${comment.user._id}`)
    const isOwner = (comment.user._id).toString() === user.id.toString();
    const isAdmin = user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only view your own comments",
      });
    }

    // 5. Success response
    res.status(200).json({
      success: true,
      data: {
        _id: comment._id,
        content: comment.content,
        post: {
          _id: comment.post._id,
          title: comment.post.title,
        },
        user: {
          _id: comment.user._id,
          name: comment.user.name,
          email: comment.user.email,
          avatar: comment.user.avatar,
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in getCommentById:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const updateComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const user = req.body.user; // injected by isLoggedIn middleware

  try {
    // 1. Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    // 2. Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required and cannot be empty",
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters",
      });
    }

    // 3. Find comment
    const comment = await commentModel
      .findById(id)
      .select("user content post")
      .lean();

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // 4. Authorization: Owner or Admin
    const isOwner = comment.user.toString() === user.id.toString();
    const isAdmin = user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only edit your own comments",
      });
    }

    // 5. Update comment
    const updatedComment = await commentModel.findByIdAndUpdate(
      id,
      { 
        content: content.trim(),
        updatedAt: Date.now() // optional: force update timestamp
      },
      { new: true, runValidators: true }
    )
    .populate([
      { path: "post", select: "title _id" },
      { path: "user", select: "name avatar" }
    ])
    .lean();

    // 6. Success response
    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: {
        _id: updatedComment._id,
        content: updatedComment.content,
        post: {
          _id: updatedComment.post._id,
          title: updatedComment.post.title,
        },
        user: {
          _id: updatedComment.user._id,
          name: updatedComment.user.name,
          avatar: updatedComment.user.avatar,
        },
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in updateComment:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteComment = async (req, res, next) => {
  const { id } = req.params;                 // comment id
  const user = req.body.user;                // from isLoggedIn middleware

  try {
    // ─── 1. Validate comment id ─────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid comment ID", 400));
    }

    // ─── 2. Fetch comment (need post & user refs) ───────────────────
    const comment = await commentModel
      .findById(id)
      .select("post user")
      .lean();

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    // ─── 3. Authorization: owner OR admin ───────────────────────────
    const isOwner = comment.user.toString() === user.id.toString();
    const isAdmin = user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return next(
        new AppError("Forbidden: You can only delete your own comments", 403)
      );
    }

    // ─── 4. Delete the comment document ─────────────────────────────
    await commentModel.findByIdAndDelete(id);

    // ─── 5. Remove reference from Post.comments[] ───────────────────
    await postModel.findByIdAndUpdate(
      comment.post,
      { $pull: { comments: id } },
      { new: true }
    );

    // ─── 6. Remove reference from User.comments[] ───────────────────
    await userModel.findByIdAndUpdate(
      comment.user,
      { $pull: { comments: id } },
      { new: true }
    );

    // ─── 7. Success response ────────────────────────────────────────
    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      data: null,
    });
  } catch (error) {
    // Let global error middleware handle unexpected errors
    return next(error);
  }
};