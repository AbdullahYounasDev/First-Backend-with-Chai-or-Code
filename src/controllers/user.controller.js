// Controllers are responsible for managing the logic behind the routes in an Express.js application. They are functions or modules that process incoming requests, interact with the data model, and send back the appropriate responses.
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {
  // Get user details
  const { email, username, fullname, password } = req.body;
  console.log(email);

  // Validation for not empty fields
  if (
    [email, username, fullname, password].some((filed) => filed?.trim === "")
  ) {
    throw new ApiError(400, "All fields are compulsory");
  }

  // Check user already exsit with same username and email
  const exsitedUser = User.findOne({
    $or: [{ email }, { username }],
  });
  if (exsitedUser) {
    throw new ApiError(409, "User name or email already taken");
  }
});

export { registerUser };
