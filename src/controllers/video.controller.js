import { Video } from "../models/video.models.js";
import mongoose from "mongoose";
import { 
            uploadOnCloudinary,
            deleteFromCloudinary,
            asyncHandler,
            ApiError,
            ApiResponse,
            getPublicId
        } from "../utils/index.js";

// -----------video controllers-----------
//get all videos

const getAllVideos = asyncHandler( async (req, res) => {
    const videos = await Video.aggregate([
        { $sort: { createdAt: -1 } },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            avatar:1,
                            username:1,
                        }
                    }
                ]
            }
        },
        {
          $addFields: {
            owner: { $first: "$owner" }
          }
        },
        {
            $project:{
                _id:1,
                thumbnail:1,
                views:1,
                duration:1,
                owner:1,
                title:1,
                description:1
            }
        }
    ])

    if(!videos.length) throw new ApiError(400,"error in fetching all videos")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "videos fetched successfully"
        )
    )
})

//publish video

const publishVideo = asyncHandler(async(req,res)=>{

    // console.log("Request body : ",req.body);
    const {title,description} = req.body
    if([title,description].some((feild)=>feild?.trim()==="")){
        throw new ApiError(400,"All feilds are required")
    }
    const videoExists = await Video.findOne({
        title:title.trim(),
        owner:req.user._id
    })
    // console.log("video Exisits : " , videoExists)
    if(videoExists){
        throw new ApiError(409,"Video with same title already exists")
    }
    
    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    // console.log("video Path : ",videoLocalPath)
    // console.log("thumbnail Path : ",thumbnailLocalPath)

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"Video file and thumbnail are required")
    }
    console.log("files Uploading to cloudinary...")
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const videoPublicId = videoFile ? videoFile.public_id : null;
    const thumbnailPublicId = thumbnail ? thumbnail.public_id : null;

    console.log("video Public Id : ",videoPublicId)
    console.log("thumbnail Public Id : ",thumbnailPublicId)
    
    if(!videoFile || !thumbnail){
        throw new ApiError(500,"Error in uploading files")
    }
    console.log("files Uploaded successfully")

    // console.log("Uploaded video file : ",videoFile)
    // console.log("Uploaded thumbnail file : ",thumbnail)
    const newVideo = await Video.create({
        title,
        description,
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        duration:videoFile.duration,
        owner:req.user._id
    })

    const postVideo = await Video.findById(newVideo._id).populate("owner","_id username fullName avatar")
    if(!postVideo){
        throw new ApiError(500,"Error in publishing video")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(201,postVideo,"Video published successfully")
    );
})

//get video by id

const getVideoById = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    const video = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "likes"
          }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments",
                // pipeline:[
                //     {
                //         $lookup:{
                //             from:"users",
                //             localField:"owner",
                //             foreignField:"_id",
                //             as:"commentOwner",
                //             pipeline:[
                //                 {
                //                     $project:{
                //                         fullName:1,
                //                         username:1,
                //                         avatar:1
                //                     }
                //                 }
                //             ]
                //         }   
                //     },
                //     {
                //         $addFields:{
                //             owner:{
                //                 $fisrt:"$commentOwner"
                //             }
                //         }
                //     }
                // ]
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
            }
        },
        {
            $addFields:{
                likeCount:{
                    $size:"$likes"
                },
                commentCount:{
                    $size:"$comments"
                },
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                views:1,
                // comments:1,
                likeCount:1,
                commentCount:1,
                "owner.username":1,
                "owner.avatar":1,
            }
        }
    ])

    if(!video?.length) throw new ApiError(404,"Video Not Found")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video[0],
            "Video found SuccessFully"
        )
    )

})

//update video

const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    if(!videoId) throw new ApiError(400,"video id is required")

    // const video = await Video.findById(videoId)
    // if(!video) throw new ApiError(404,"video is not find")

    // if(video.owner.toString() !== req.user._id.toString()) throw new ApiError(403,"you are not authorized to update this video")
        
    const {title,description} = req.body
    if(!title || !description) throw new ApiError(400,"all feilds are required")

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
            },
        },
        { new : true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "update video details successfully!"
        )
    )
    
})

//delete video

const deleteVideoById = asyncHandler(async (req,res)=>{
    const {videoId} = req.params;  
    if(!videoId){
        throw new ApiError(400,"Video id is required")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to delete this video")
    }

    const videoPublicId = await getPublicId(video.videoFile);
    const thumbnailPublicId = await getPublicId(video.thumbnail);

    if(!videoPublicId || !thumbnailPublicId){
        throw new ApiError(500,"Error in extracting public ids from video urls")
    }

    console.log("Deleting video and thumbnail from cloudinary...")
    const videoDeleted = await deleteFromCloudinary(videoPublicId,"video");
    const thumbnailDeleted = await deleteFromCloudinary(thumbnailPublicId,"image");

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if( !deletedVideo) throw new ApiError(400,"Video can't deleted")
        
    return res
    .status(200)
    .json(
        new ApiResponse(200,null,"Video deleted successfully")
    );

})
//togglePublish status

const isPublished = asyncHandler(async (req,res)=>{
    // i don't know what to do in this function
})


export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideoById,
    isPublished
}


//-----------comment controllers-----------

//get all comments for a video
//add comment to a video
//update comment
//delete comment






