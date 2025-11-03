import { Tweet } from "../models/tweet.models.js"
import mongoose from "mongoose";
import { 
            asyncHandler,
            ApiError,
            ApiResponse,
        } from "../utils/index.js";


//TODO -----------tweet controllers-----------

//create tweet

const addTweet = asyncHandler(async (req,res) => {
    const {content} = req.body
    if(!content) throw new ApiError(400,"tweet required")
    
    const tweet = await Tweet.create({
        content,
        owner : new mongoose.Types.ObjectId(req.user._id)
    })

    if(!tweet) throw new  ApiError(
        403,
        "Error in post tweet"
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "tweet post successfully"
        )
    )
})

//get all tweets

const getAllTweets = asyncHandler( async (req,res) => {
    const tweets = await Tweet.aggregate([
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as : "owner",
                pipeline:[
                    {
                        $project:{
                            avatar:1,
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])
    if(!tweets.length) throw new ApiError(
        400,
        "Can't fatched All Tweets"
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "All tweets fetched successfully"
        )
    ) 
})

//get all tweets for a user

const userTweets = asyncHandler( async (req,res) => {
    const {userId} = req.params
    if(!userId) throw new ApiError(400,"user not valid") 
    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as : "owner",
                pipeline:[
                    {
                        $project:{
                            avatar:1,
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])
    if(!tweets.length) throw new ApiError(
        400,
        "Can't fatched All Tweets"
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "All tweets fetched successfully"
        )
    ) 
})

//get tweet by id

const getTweetById = asyncHandler( async (req,res) => {
    const {tweetId} = req.params
    if(!tweetId) throw new ApiError(400,"tweet not valid") 
    const tweet = await Tweet.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as : "owner",
                pipeline:[
                    {
                        $project:{
                            avatar:1,
                            username:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])
    if(!tweet.length) throw new ApiError(
        400,
        "Can't fatched Tweet"
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet[0],
            "tweet fetched successfully"
        )
    ) 
})

//update tweet

const updateTweet = asyncHandler( async (req,res) => {
    const {tweetId} = req.params
    if(!tweetId) throw new ApiError(400,"tweet not valid")

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) throw new ApiError(404,"Tweet Not Found")

    if(req.user._id.toString() !== tweet.owner.toString()) throw new ApiError(403,"You are Not authorized to update this tweet")

    const {content} = req.body
    if(!content) throw new ApiError(400,"content is required")

    const newtweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content,
            },
        },
        { new:true }
    )
    if(!newtweet) throw new ApiError(400,"tweet not find to update")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newtweet,
            "tweet update successfully"
        )
    ) 
})

//delete tweet

const deleteTweet = asyncHandler( async (req,res) => {
    const {tweetId} = req.params
    if(!tweetId) throw new ApiError(400,"tweet not valid")

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) throw new ApiError(404,"Tweet Not Found")

    if(req.user._id.toString() !== tweet.owner.toString()) throw new ApiError(403,"You are Not authorized to delete this tweet")

    const deletedtweet = await Tweet.findByIdAndDelete(
        tweetId
    )
    if(!deletedtweet) throw new ApiError(400,"some Error in delete")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "tweet delete successfully"
        )
    ) 
})


export {
    addTweet,
    getAllTweets,
    userTweets,
    getTweetById,
    updateTweet,
    deleteTweet
}