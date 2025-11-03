import { Comment } from "../models/comment.models.js"
import mongoose from "mongoose";
import { 
            asyncHandler,
            ApiError,
            ApiResponse,
        } from "../utils/index.js";



// -----------comment controllers-----------

//get all comments for a video

const getAllComments = asyncHandler( async (req,res) => {
    const {videoId} = req.params
    if(!videoId) throw new ApiError(400,"not valid video reference")

    const comments = await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
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
                    $first:"$owner"
                }
            }
        }
    ])

    if(!comments.length) throw new ApiError(
        404,
        "comments not found"
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "all comments fetched successfully"
        )
    )
    
})

//add comment to a video

const addComment = asyncHandler( async (req,res) => {
    const {videoId} = req.params
    if(!videoId) throw new ApiError(400,"video is not valid")

    const {content} = req.body
    if(!content) throw new ApiError(400,"content body is required")

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id 
    })

    if(!comment) throw new ApiError(400,"comment is not post")
    
    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment Post SuccessFully"
        )
    )
    
})

//update comment

const updateComment = asyncHandler( async (req,res) => {
    const {commentId} = req.params
    if(!commentId) throw new ApiError(400,"Comment Id is not valid")

    const comment = await Comment.findById(commentId)
    if(!comment) throw new ApiError(404,"Comment Not Found")

    if(req.user._id.toString() !== comment.owner.toString()){
        throw new ApiError(403,"you are not authorized to update this comment")
    }

    const {content} = req.body
    if(!content) throw new ApiError(400,"content body is required")

    const newComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content,
            },
        },
        { new : true }
    )
    
    if(!newComment) throw new ApiError(403,"error in updating comment")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newComment,
            "Comment Update SuccessFully"
        )
    )
})

//delete comment

const deleteComment = asyncHandler( async (req,res) => {
    const {commentId} = req.params
    if(!commentId) throw new ApiError(400,"Comment Id is not valid")
        
    const comment =await Comment.findById(commentId)
    if(!comment) throw new ApiError(400,"Comment not found")

    if(req.user._id.toString()!==comment.owner.toString()){
        throw new ApiError(403,"you are not authorized to delete this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment) throw new ApiError(400,"comment can't deleted")
    
    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            null,
            "Comment delete SuccessFully"
        )
    )
})


export {
    getAllComments,
    addComment,
    updateComment,
    deleteComment
}