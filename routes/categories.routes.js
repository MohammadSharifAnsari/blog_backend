import express from "express";
import isloggedin from "../middleware/auth.middleware.js";
import { getAllCategories, getCategoryById } from "../controller/category.controller.js";

const router = express.Router();

router.get("/all",getAllCategories);
router.get("/get/:id",getCategoryById);



export default router;