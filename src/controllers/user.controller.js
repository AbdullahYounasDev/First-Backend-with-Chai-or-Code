// Controllers are responsible for managing the logic behind the routes in an Express.js application. They are functions or modules that process incoming requests, interact with the data model, and send back the appropriate responses.
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.genrateAccessToken();
    const refreshToken = user.genrateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong to genrate access and referesh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Get user details
  const { email, username, fullname, password } = req.body;

  // Validation for not empty fields
  if (
    [email, username, fullname, password].some((filed) => filed?.trim === "")
  ) {
    throw new ApiError(400, "All fields are compulsory");
  }

  // Check user already exsit with same username and email
  // User is model which is created throw mongoose and it can access data in mongodb

  // const exsitedUser = await User.findOne({
  //   $or: [{ email }, { username }],
  // });
  // if (exsitedUser) {
  //   throw new ApiError(409, "User name or email already taken");
  // }

  const exsitedUsername = await User.findOne({ username });
  const exsitedEmail = await User.findOne({ email });
  if (exsitedUsername) {
    throw new ApiError(409, "User name is already taken");
  }
  if (exsitedEmail) {
    throw new ApiError(409, "Email is already taken");
  }

  // check the cover image and avatar come or not
  // avatar is nessary and coverImage is not
  // req.files come from multer
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  // cover image
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Create user

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    password,
    coverImage: coverImage?.url || "",
    avatar: avatar.url,
  });

  // to remove passowrd and refreshtoken
  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(
      500,
      "Something went wrong to register the user on server"
    );
  }

  // Return response
  console.log("Success");
  return res
    .status(201)
    .json(new ApiResponse(200, "User Registerd Successfully", userCreated));
});

// For Login
const loginUser = asyncHandler(async (req, res) => {
  // Get user details from req.body
  const { email, username, password } = req.body;

  // check if email and username comes
  if (!(email || username)) {
    throw new ApiError(400, "Email or Username are required");
  }

  // compare it with username or email with mongodb's data
  const user = await User.findOne({
    //  $or is mongodb operator
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(
      404,
      "User is not registered with this username and email"
    );
  }

  // check password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not correct");
  }

  // get access token and refresh token from based on userId
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // For update (mean having refresh token because we create user objecct upper and add add refresh token and access token bottom here so we have to create another user object with update values) users informatoin we have to create another user
  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // These options are created for security purpose for only cookies are update from server not update from frontend and others only update from server
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: updatedUser,
          accessToken,
          refreshToken,
        },
        "User Logged in Successfully"
      )
    );
});

// For logout
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, `${req.user.fullname} is logout`, {}));
});

// Access and refresh token update if user is logged in after expire access token
const RefreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.refreshToken
    );

    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, "Access token refreshed", {
          accessToken,
          refreshToken: newRefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// For Password Change
const changeCurrentPassword = asyncHandler(async (res, req) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!(newPassword == confirmNewPassword)) {
    throw new ApiError(
      400,
      "New Password and Confirm New Password are not match"
    );
  }

  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isOldPasswordCorrect) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Passowrd Changed Successfully", {}));
});

// User who is currently logedin
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current User Get SuccessFully", res.user));
});

// Update User Info
const updateUserInfo = asyncHandler(async (req, res) => {
  const { email, fullname } = req.body;
  if (!email || !fullname) {
    throw new ApiError(400, "Email and Full Name is must");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Account info updated", user));
});

// Update avatar
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "There is error while uploading avatar on server");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: avatar.url,
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar Update Successfully", user));
});

// Update cover image
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(
      400,
      "There is error while uploading cover image on server"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      coverImage: coverImage.url,
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "cover image Update Successfully", user));
});

// controller for channel profile
const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Dont find channel with this username");
  }

  const channel = await User.aggregate([
    {
      // this pipline is use to match username from db
      $match: {
        username: username,
      },
    },
    {
      // This is use to find our subscribers by comparing id come from user with channel and the channel (basically documents) with this id are founded in array format, throw this we can find user's channel subscribers
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber",
      },
    },
    {
      // This is use to find our subscribed channel mean those channel whos subscribed by our channel. In this we compare user id with the total subscriber and the subscriber (basically documents) come with this id are in array format gotted, throw this we can find who is subscriberb by user's channel
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberTo",
      },
    },
    {
      // This will add  subscribersCount and channelToBeSubscribedCount fields in the user
      //  $subscriber is come as: subscriber
      $addFields: {
        subscribersCount: {
          $size: "$subscriber",
        },
        channelToBeSubscribedCount: {
          $size: "$subscriberTo",
        },
        // use to check is subscriber is subscribed or not
        isSubscribed: {
          $cond: {
            // this will check is current user id is present in subscribers
            if: { $in: [req.user?._id, "$subscriber.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Project will add only added fields in the channel
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        subscribersCount: 1,
        channelToBeSubscribedCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User channel fetched", channel[0]));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "watchHistory",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              $first: "$owner",
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, "Watch Hitory Detected", user[0].watchHistory));
});

export {
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
};
