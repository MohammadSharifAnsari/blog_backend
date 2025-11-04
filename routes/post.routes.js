import express from "express";
import isloggedin from "../middleware/auth.middleware.js";
import {
    addComment,
  createPost,
  deletePost,
  getAllPosts,
  getCommentsByPost,
  getPostById,
  getPostsWithFilters,
  getRelatedPosts,
  incrementView,
  likePost,
  updatePost
} from "../controller/post.controller.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

const uploadMiddleware = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "media", maxCount: 5 },
]);
router.post("/create", uploadMiddleware, isloggedin, createPost);
router.get("/all", getAllPosts);
router.get("/getpost/:id", getPostById);
router.put("/:id",uploadMiddleware,isloggedin,updatePost);
router.delete("/:id",isloggedin,deletePost);
router.post("/:id/like",isloggedin,likePost);
router.post("/:id/comment",isloggedin,addComment)
router.get("/:id/comment",isloggedin,getCommentsByPost)
router.get("/related/:id",isloggedin,getRelatedPosts)
router.put("/:id/views",isloggedin,incrementView)
router.get("/filtersearch",getPostsWithFilters);

// 68f7de90783c72109e306321

export default router;
