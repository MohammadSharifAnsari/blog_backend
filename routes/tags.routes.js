import express from "express";
import isloggedin from "../middleware/auth.middleware.js";
import { getAllTags, getTagById } from "../controller/tag.controller.js";

const router = express.Router();

router.get("/all",getAllTags);
router.get("/:id",getTagById)


export default router;