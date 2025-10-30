import express from "express";
import isloggedin from "../middleware/auth.middleware.js";
import isAdmin from "../middleware/isAdmin.middleware.js";
import { createCategory, createTag, deleteCategory, deleteTag, deleteUser, getAllComments, getAllUsers, getUserById, updateCategory, updateTag } from "../controller/Admin.controller.js";
import authorizeOwnerOrAdmin from "../middleware/authorizeOwnerOrAdmin.middleware.js";
const router= express.Router();

router.get("/all",isloggedin,isAdmin("Admin"),getAllUsers);
router.get("/get/:id",isloggedin,authorizeOwnerOrAdmin,getUserById);
router.delete("/delete/:id",isloggedin,authorizeOwnerOrAdmin,deleteUser);
router.get("/allcomment",isloggedin,isAdmin("Admin"),getAllComments);
router.post("/createcategory",isloggedin,isAdmin("Admin"),createCategory);
router.put("/updatecategory/:id",isloggedin,isAdmin("Admin"),updateCategory)
router.delete("/deletecategory/:id",isloggedin,isAdmin("Admin"),deleteCategory);
router.post("/createtag",isloggedin,isAdmin("Admin"),createTag);
router.put("/updatetag/:id",isloggedin,isAdmin("Admin"),updateTag);
router.delete("/deletetag/:id",isloggedin,isAdmin("Admin"),deleteTag);

export default router;
