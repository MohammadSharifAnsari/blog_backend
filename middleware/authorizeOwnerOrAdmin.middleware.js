
import AppError from "../utils/error.utils.js";

const authorizeOwnerOrAdmin = (req, res, next) => {
  const authenticatedUser = req.body.user;
  const { id } = req.params;

  // Ensure user is authenticated
  if (!authenticatedUser) {
    return next(new AppError("Authentication required", 401));
  }
  console.log("[blog_backend/middleware/authorizeOwnerOrAdmin.middleware.js]:authenticatedUser.role",authenticatedUser.role)

  // Check if user is Admin OR owns the resource
  const isAdmin = authenticatedUser.role === "Admin";
  const isOwner = id && authenticatedUser.id.toString() === id.toString();

  if (isAdmin || isOwner) {
    return next();
  }

  return next(new AppError("Forbidden: You don't have permission to perform this action", 403));
};

export default authorizeOwnerOrAdmin;