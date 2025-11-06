import mongoose from "mongoose";
import { 
            asyncHandler,
            ApiError,
            ApiResponse,
        } from "../utils/index.js";
import {Like} from "../models/like.models.js"



//-----------like controllers-----------

//toggle like on a video

const toggleLikeOnVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video ID is required");

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json(
      new ApiResponse(200, null, "Successfully removed like from video")
    );
  }

  const newLike = await Like.create({
    video: videoId,
    likedBy: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, newLike, "Successfully liked the video")
  );
});

//toggle comment like

const toggleLikeOnComment = asyncHandler( async (req,res) =>{
    const {commentId} = req.params
    if(!commentId) throw new ApiError(400,"comment not valid") 

    const existsCommentLike = await Like.findOneAndDelete({
        comment:new mongoose.Types.ObjectId(commentId),
        likedBy:new mongoose.Types.ObjectId(req.user?._id)
    })

    if(existsCommentLike){
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "successfully removed like on this comment"
            )
        )
    }

    const newCommentLike = await Like.create({
        comment:new mongoose.Types.ObjectId(commentId),
        likedBy:new mongoose.Types.ObjectId(req.user?._id)
    })

    if(!newCommentLike) throw new ApiError(500,"error in post like on this comment")

    return res
    .status(200)
    .json(
        new ApiResponse(
                200,
                newCommentLike,
                "successfully post like on this comment"
            )
    )
})

//toggle tweet like


const toggleLikeOnTweet = asyncHandler(async (req,res)=>{
    const {tweetId} = req.params
    if(!tweetId) throw new ApiError(400,"tweet not valid") 

    const existsTweetLike = await Like.findOneAndDelete({
        tweet:new mongoose.Types.ObjectId(tweetId),
        likedBy:new mongoose.Types.ObjectId(req.user?._id)
    })

    if(existsTweetLike){
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "successfully removed like on this tweet"
            )
        )
    }

    const newTweetLike = await Like.create({
        tweet:new mongoose.Types.ObjectId(tweetId),
        likedBy:new mongoose.Types.ObjectId(req.user?._id)
    })

    if(!newTweetLike) throw new ApiError(500,"error in post like on this tweet")

    return res
    .status(200)
    .json(
        new ApiResponse(
                200,
                newTweetLike,
                "successfully post like on this tweet"
            )
    )
})
//get all liked videos for a user

const getAllLikedVideosOfUser = asyncHandler(async(req,res)=>{
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user?._id)
            }
        }
    ])
    if(!likedVideos.length) throw new ApiError(500,"error in fetching all liked video by user")
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "successfully fetched all liked videos"
        )
    )
})

export {
    toggleLikeOnVideo,
    toggleLikeOnComment,
    toggleLikeOnTweet,
    getAllLikedVideosOfUser
}