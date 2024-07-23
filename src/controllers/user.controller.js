// Controllers are responsible for managing the logic behind the routes in an Express.js application. They are functions or modules that process incoming requests, interact with the data model, and send back the appropriate responses.
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };
