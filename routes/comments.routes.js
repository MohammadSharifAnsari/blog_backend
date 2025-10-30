import express from "express";
import isloggedin from "../middleware/auth.middleware.js";
import { deleteComment, getCommentById, updateComment } from "../controller/comment.controller.js";


const router = express.Router();

router.get("/get/:id",isloggedin,getCommentById)
router.put("/update/:id",isloggedin,updateComment);
router.delete("/delete/:id",isloggedin,deleteComment);




export default router;