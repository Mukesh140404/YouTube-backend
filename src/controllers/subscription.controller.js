import mongoose, { Types } from "mongoose";
import {View} from "../models/views.models.js"
import {Video} from "../models/video.models.js"
import {
    ApiError,
    ApiResponse,
    asyncHandler
} from "../utils/index.js"

// add View
const addViewOnVideo = asyncHandler(async(req,res)=>{
    const {videoId}  = req.params
    if(!videoId) throw new ApiError(400,"video id not valid")
    
    const existsView = await View.findOne({
        $and:[
            {video:new mongoose.Types.ObjectId(videoId)},
            {user:new mongoose.Types.ObjectId(req.user?._id)}
        ]
    })
    if(existsView){
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                existsView,
                "view already count"
            )
        )
    }
    
    const newView = await View.create({
        video:new mongoose.Types.ObjectId(videoId),
        user:new mongoose.Types.ObjectId(req.user?._id)
    })

    if(!newView) throw new ApiError(500,"error in add view on video")
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            newView,
            "add view count by 1"
        )
    )

})

// get all view for a video

const getAllViewsForVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!videoId) throw new ApiError(400,"video id not valid")
    
    const views = await View.find({
        video:new mongoose.Types.ObjectId(videoId)
    })
    if(!views) throw new ApiError(404,"views on this videos not exists")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            views,
            "All views are fetched"
        )
    )
})