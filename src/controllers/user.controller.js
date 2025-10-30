import { User } from "../models/user.models.js";
import { 
            uploadOnCloudinary,
            deleteFromCloudinary,
            asyncHandler,
            ApiError,
            ApiResponse,
            getPublicId
        } from "../utils/index.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const genrateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "something wentwrong while genrating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // return res.status(200).json({
  //     message: "ok"
  // })

  // get user details from frontend

  // validation - not empty
  // check user is already exists: username, email
  // check for images,check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and referesh token from response
  // check for user creation
  // return response

  const { fullName, email, username, password } = req.body;

  // console.log("\n\nrequest body : ", req.body);
  // console.log("email: ",email)

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  console.log("\n\nrequest files : ", req.files);

  console.log("avatar taking");
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log("avatar taken");
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("coverImage taken");

  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }

  if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required");
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(500, "Error in uploading avatar image");

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) throw new ApiError(500, "User registration failed");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  console.log("req body : ", req.body);

  //get email/username or password from frontend
  const { email, username, password } = req.body;

  //validation - not empty
  if (!username && !email)
    throw new ApiError(400, "username or email is required");

  //check email/username is exists or not
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) throw new ApiError(404, "User dose not exists");

  //check password is correct for the email/username
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid User Credentials");

  //access and refresh token
  const { accessToken, refreshToken } = await genrateTokens(user._id);
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  //send response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
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
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken)
    throw new ApiError(401, "Refresh token is required");

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decoded?._id);

    if (!user) throw new ApiError(404, "Invalid refresh Token");

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await genrateTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // console.log(req.body);
  
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPswdCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPswdCorrect) throw new ApiError(400, "Old password is incorrect");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentuser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "fullName and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // console.log(req.file);

  const publicId = getPublicId(req.user?.avatar)
  if(!publicId) throw new ApiError(400,"Unauthorized User");



  const avatarLocalpath = req.file?.path;
  if (!avatarLocalpath) throw new ApiError(400, "Avatar image is required");
  const avatar = await uploadOnCloudinary(avatarLocalpath);

  if (!avatar.url) throw new ApiError(400, "Error while uploading on avatar");


  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  const isDeletedFromCloudinary = await deleteFromCloudinary(publicId)
  if(isDeletedFromCloudinary !== "ok"){
    console.log("Error in deleting previous avatar from cloud")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {

  const publicId = getPublicId(req.user?.coverImage)
  if(!publicId) throw new ApiError(400,"Unauthorized User");

  const coverImageLocalpath = req.file?.path;
  if (!coverImageLocalpath) throw new ApiError(400, "cover image is required");
  const coverImage = await uploadOnCloudinary(coverImageLocalpath);

  if (!coverImage.url)
    throw new ApiError(400, "Error while uploading on cover image");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  const isDeletedFromCloudinary = await deleteFromCloudinary(publicId)
  if(isDeletedFromCloudinary !== "ok"){
    console.log("Error in deleting previous avatar from cloud")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req,res)=>{

  console.log(req.params)
  const username = req.params.username;
  console.log(username);
  
  if(!username?.trim()) throw new ApiError(400,"username is missing")

  const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as: "subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as: "subscribeTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelSubscribedToCount:{
          $size:"$subscribeTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id,"$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])

  if(!channel?.length) throw new ApiError(404,"channel does not exists")

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
  )

})

const getWatchHistory = asyncHandler(async (req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id:new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as : "watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as : "owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $fisrt:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watch history fetched successfully"
    )
  )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentuser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
