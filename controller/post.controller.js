import postModel from "../model/post.schema.js";
import fs from "fs/promises";
import categoryModel from "../model/category.schema.js";
import tagModel from "../model/tag.schema.js";
import cloudinary from "cloudinary";
import AppError from "../utils/error.utils.js";
import commentModel from "../model/comment.schema.js"; 
import userModel from "../model/user.schema.js";
import mongoose from "mongoose";

export const createPost = async (req, res, next) => {
  try {
    const { title, content, categories, tags, isPublished } = req.body;

    // 1️⃣ Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    // 2️⃣ Upload avatar (thumbnail)
    let avatar = {};
    if (req.files?.avatar) {
      try {
        const file = req.files.avatar[0];
        console.log(
          `[blog_backend/controller/post.controller.js] req.files.avatar[0].path>>${file.path}`
        );
        const avatarUpload = await cloudinary.v2.uploader.upload(file.path, {
          folder: `${process.env.FOLDER_NAME}/avatar`,
          width: 250, //by default heigt and width is in pexel unit
          height: 250,
          gravity: "faces", //focus image ke fase pe rakhna hai
          crop: "fill", //crop karke khali jagah nhi dikhni chahiye
        });
        if (avatarUpload) {
          console.log("[blog_backend/controller/post.controller.js] line 38");
          avatar = {
            public_id: avatarUpload.public_id,
            secure_url: avatarUpload.secure_url,
          };
          console.log("[blog_backend/controller/post.controller.js] line 43");
          await fs.rm(`${file.path}`);
        }
      } catch (error) {
        return next(
          new AppError("avatar does not uploaded ,please try again", 404)
        );
      }
    }
    console.log("[blog_backend/controller/post.controller.js] line 54");

    // 3️⃣ Upload multiple media files (images/videos)
    const media = [];
    if (req.files?.media) {
      try {
        const mediaFiles = Array.isArray(req.files.media)
          ? req.files.media
          : [req.files.media];

        for (const file of mediaFiles) {
          console.log(
            `[blog_backend/controller/post.controller.js] file.path>>${file.path}`
          );
          const upload = await cloudinary.v2.uploader.upload(file.path, {
            folder: `${process.env.FOLDER_NAME}/media`,
            resource_type: "auto",
          });
          if (upload) {
            console.log("[blog_backend/controller/post.controller.js] line 71");
            media.push({
              public_id: upload.public_id,
              secure_url: upload.secure_url,
            });
            await fs.rm(`${file.path}`);
          }
        }
      } catch (error) {
        return next(
          new AppError("media file does not uploaded ,please try again", 404)
        );
      }
    }

    // 4️⃣ Handle categories (find or create)
    let categoryIds = [];
    if (categories) {
      const categoryArray = Array.isArray(categories)
        ? categories
        : categories.split(",").map((c) => c.trim());

      for (const name of categoryArray) {
        let category = await categoryModel.findOne({ name });
        if (!category) {
          category = await categoryModel.create({ name });
        }
        categoryIds.push(category._id);
      }
    }

    // 5️⃣ Handle tags (find or create)
    let tagIds = [];
    if (tags) {
      const tagArray = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim());

      for (const name of tagArray) {
        let tag = await tagModel.findOne({ name });
        if (!tag) {
          tag = await tagModel.create({ name });
        }
        tagIds.push(tag._id);
      }
    }

    // 6️⃣ Create new post
    console.log(`req.body.user._id>> ${req.body.user.id}`);
    const post = await postModel.create({
      title,
      content,
      media,
      avatar,
      author: req.body.user.id, // set by auth middleware
      categories: categoryIds,
      tags: tagIds,
      isPublished: isPublished || true,
      publishedAt: isPublished ? new Date() : null,
    });

    // 7️⃣ Response
    res.status(201).json({
      success: true,
      message: "Post created successfully!",
      post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const getAllPosts = async (req, res, next) => {
  try {
    // 1️⃣ Extract query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, published } = req.query;

    // 2️⃣ Build filter
    const filter = {};
    if (published) {
      filter.isPublished = (published === "true");
    }

    // 3️⃣ Handle multiple category filters
    if (category) {
      // can be single or multiple categories (comma-separated)
      const categoryNames = category.split(",").map((c) => c.trim());

      const categoriesFound = await categoryModel.find({
        name: { $in: categoryNames.map((c) => new RegExp(c, "i")) }, // case-insensitive match
      });

      if (categoriesFound.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No matching categories found for: ${categoryNames.join(", ")}`,
        });
      }

      // Filter posts that have *any* of these category IDs
      filter.categories = { $in: categoriesFound.map((cat) => cat._id) };
    }

    // 4️⃣ Fetch posts
    const posts = await postModel
      .find(filter)
      .populate("author", "name email avatar")
      .populate("categories", "name")
      .populate("tags", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  // .populate({
  //       path: "comments",
  //       populate: { path: "user", select: "name avatar" },
  //     })
    // 5️⃣ Count for pagination
    const totalPosts = await postModel.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    // 6️⃣ Response
    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages,
      totalPosts,
      resultsOnPage: posts.length,
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1️⃣ Validate ID format
    if (!id || id.length !== 24) {
      console.log("[blog_backend/controller/post.controller.js] line 229")
      return next(new AppError("Invalid or missing post ID", 400));
    }

    // 2️⃣ Find post by ID and populate related fields
    const post = await postModel
      .findById(id)
      .populate("author", "name email avatar") // only specific fields of user
      .populate("categories", "name description")
      .populate("tags", "name")
      .populate({
        path: "comments",
        model: commentModel,
        populate: { path: "user", select: "name email avatar" },
      });

    // 3️⃣ Handle case if post not found
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // 4️⃣ Optionally increase view count
    post.views += 1;
    await post.save();

    // 5️⃣ Send success response
    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      post,
    });
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params; // post ID from route
    const user = req.body.user; // current logged-in user (from auth middleware)
    const { title, content, categories, tags, isPublished } = req.body;

    // 1️⃣ Check post existence
    const post = await postModel.findById(id);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    // 2️⃣ Permission check — Only Author or Admin can update
    console.log("[blog_backend/controller/post.controller.js]:post.author>>",post.author);
    console.log("[blog_backend/controller/post.controller.js]:user._id>>",user.id);
    if (post.author.toString() !== user.id.toString() && user.role !== "Admin") {
      return next(new AppError("You are not authorized to update this post", 403));
    }

    // 3️⃣ Prepare update data
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      updateData.publishedAt = isPublished ? new Date() : null;
    }

    // 4️⃣ Handle new avatar (thumbnail)
    if (req.files?.avatar) {
      // Delete old avatar from Cloudinary if exists
      if (post.avatar?.public_id) {
        await cloudinary.v2.uploader.destroy(post.avatar.public_id);
      }

      const avatarUpload = await cloudinary.v2.uploader.upload(
        req.files.avatar[0].path,
        {
          folder: `${process.env.FOLDER_NAME}/avatar`,
          width: 250,
          height: 250,
          gravity: "faces",
          crop: "fill",
        }
      );

      updateData.avatar = {
        public_id: avatarUpload.public_id,
        secure_url: avatarUpload.secure_url,
      };

      fs.rm(`uploads/${req.files.avatar[0].filename}`, { force: true }, () => {});
    }

    // 5️⃣ Handle new media files
    if (req.files?.media) {
      const mediaFiles = Array.isArray(req.files.media)
        ? req.files.media
        : [req.files.media];
      const uploadedMedia = [];

      for (const file of mediaFiles) {
        const upload = await cloudinary.v2.uploader.upload(file.path, {
          folder: `${process.env.FOLDER_NAME}/media`,
          resource_type: "auto",
        });
        uploadedMedia.push({
          public_id: upload.public_id,
          secure_url: upload.secure_url,
        });
        fs.rm(`uploads/${file.filename}`, { force: true }, () => {});
      }

      updateData.media = uploadedMedia;
    }

    // 6️⃣ Update categories & tags if provided
    if (categories) updateData.categories = categories.split(",");
    if (tags) updateData.tags = tags.split(",");

    // 7️⃣ Update in DB
    const updatedPost = await postModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // 8️⃣ Send success response
    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.user?.id; // Assuming authentication middleware sets req.user
    const userRole = req.body.user?.role;

    // 1️⃣ Find the post
    const post = await postModel.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // 2️⃣ Check permission (only author or admin)
    if (post.author.toString() !== userId.toString() && userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }

    // 3️⃣ Delete the post
    await postModel.findByIdAndDelete(id);

    // 4️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params; // Post ID from path
    const userId = req.body.user?.id; // Logged-in user's ID (from auth middleware)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in to like a post.",
      });
    }

    
    const post = await postModel.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // 2️⃣ Check if user already liked the post
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike (remove user from likes)
      post.likes = post.likes.filter(
        (uid) => uid.toString() !== userId.toString()
      );
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post unliked successfully.",
        likesCount: post.likes.length,
      });
    } else {
      // Like (add user to likes)
      post.likes.push(userId);
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post liked successfully.",
        likesCount: post.likes.length,
      });
    }
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const addComment = async (req, res) => {
  try {
    const { id } = req.params; // post ID from URL
    const { content } = req.body; // comment content
    const user = req.body.user; // logged-in user details from middleware

    // 1️⃣ Check user authentication
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in to comment.",
      });
    }

    // 2️⃣ Validate comment content
    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment content is required.",
      });
    }

    // 3️⃣ Check if post exists
    const post = await postModel.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }
    const userWhoComment= await userModel.findById(user.id);

    // 4️⃣ Create new comment
    const newComment = await commentModel.create({
      post: post.id,
      user: user.id,
      content,
    });

    // 5️⃣ Add comment ID to post.comments array
    post.comments.push(newComment.id);
    userWhoComment.comments.push(newComment.id);
    await userWhoComment.save();
    await post.save();

    // 6️⃣ Populate the comment with user info (for frontend display)
    const populatedComment = await commentModel.findById(newComment.id).populate(
      "user",
      "name email avatar"
    );

    // 7️⃣ Send success response
    res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { id } = req.params; 

    // 1️⃣ Validate post exists
    const post = await postModel.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // 2️⃣ Fetch all comments for this post and populate user details
    const comments = await commentModel
      .find({ post: id })
      .populate("user", "name email avatar") // send limited user data
      .sort({ createdAt: -1 }); // latest comments first

    // 3️⃣ Return response
    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });

  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
export const getRelatedPosts = async (req, res) => {
  const { id } = req.params;                 // post id from URL
  const LIMIT = 6;                           // max related posts to return

  try {
    // ---- 1. Validate post ID -------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID" });
    }

    // ---- 2. Fetch the source post (published only) ---------------------------
    const sourcePost = await postModel
      .findOne({ _id: id, isPublished: true })
      .select("categories tags")
      .lean();

    if (!sourcePost) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found or not published" });
    }

    const { categories = [], tags = [] } = sourcePost;

    // If post has no categories AND no tags → nothing to match
    if (categories.length === 0 && tags.length === 0) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    // ---- 3. Build $or query for matching categories OR tags ------------------
    const matchConditions = [];

    if (categories.length) {
      matchConditions.push({ categories: { $in: categories } });
    }
    if (tags.length) {
      matchConditions.push({ tags: { $in: tags } });
    }

    // ---- 4. Query related posts ---------------------------------------------
    const relatedPosts = await postModel
      .find({
        $and: [
          { _id: { $ne: id } },               // exclude the source post
          { isPublished: true },              // only published posts
          { $or: matchConditions },           // share cat OR tag
        ],
      })
      .select(
        "title avatar secure_url content author categories tags likes views createdAt"
      )
      .populate([
        { path: "author", select: "name avatar" },
        { path: "categories", select: "name" },
        { path: "tags", select: "name" },
      ])
      .sort({ createdAt: -1 })               // newest first
      .limit(LIMIT)
      .lean();

    // ---- 5. Response ---------------------------------------------------------
    res.status(200).json({
      success: true,
      count: relatedPosts.length,
      data: relatedPosts,
    });
  } catch (error) {
    console.error("getRelatedPosts error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching related posts" });
  }
};
export const incrementView = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID",
      });
    }

    // 2. Use findOneAndUpdate to atomically increment views
    //    - Only increment if post exists AND is published
    const updatedPost = await postModel.findOneAndUpdate(
      { _id: id, isPublished: true },
      { $inc: { views: 1 } },
      { new: true, select: "views" } // return only updated views
    );

    // 3. If post not found or not published
    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found or not published",
      });
    }

    // 4. Success response
    res.status(200).json({
      success: true,
      message: "View count incremented",
      data: {
        postId: id,
        views: updatedPost.views,
      },
    });
  } catch (error) {
    console.error("Error incrementing view:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getPostsWithFilters = async (req, res) => {
  try {
    console.log("start")
    const {
      search = "",
      tag,
      category,
      page = 1,
      limit = 10,
    } = req.query;
    console.log("search=",search)

    // ---- 1. Sanitize & Validate Inputs ----
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10))); // max 50
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = { isPublished: true };

    // ---- 2. Add Tag/Category Filters (if provided) ----
    if (tag) {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        return res.status(400).json({
          success: false,
          message: "Invalid tag ID",
        });
      }
      filter.tags = tag;
    }

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID",
        });
      }
      filter.categories = category;
    }

    // ---- 3. Build Regex Search (case-insensitive) ----
    let searchRegex;
    if (search.trim()) {
      // Escape special regex chars, then make case-insensitive
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      searchRegex = new RegExp(escaped, "i");
    }

    // ---- 4. Build Final Query ----
    let query = postModel.find(filter);

    if (searchRegex) {
      // Search in title OR content
      query = query.or([
        { title: searchRegex },
        { content: searchRegex },
      ]);
    }

    // ---- 5. Count Total Matching Documents ----
    const total = await postModel.countDocuments(
      searchRegex
        ? { ...filter, $or: [{ title: searchRegex }, { content: searchRegex }] }
        : filter
    );

    // ---- 6. Execute Paginated Query with Population ----
    const posts = await query
      .select(
        "title content avatar author categories tags likes views createdAt"
      )
      .populate([
        { path: "author", select: "name avatar" },
        { path: "categories", select: "name" },
        { path: "tags", select: "name" },
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // ---- 7. Build Pagination Metadata ----
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // ---- 8. Send Response ----
    res.status(200).json({
      success: true,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext,
        hasPrev,
      },
      data: posts,
    });
  } catch (error) {
    console.error("Error in getPostsWithFilters:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

