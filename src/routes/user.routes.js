import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  RefreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserInfo,
  updateAvatar,
  updateCoverImage,
  getChannelProfile,
  getUserWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // middleware
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  // controller
  registerUser
);

router.route("/login").post(loginUser);

// Secure Routes is user logged in
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(RefreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateUserInfo);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/c/:username").get(verifyJWT, getChannelProfile);
router.route("/history").get(verifyJWT, getUserWatchHistory);

export default router;
