import mongoose from "mongoose";
import {
    ApiError,
    ApiResponse,
    asyncHandler
} from "../utils/index.js"
import {Subscription} from "../models/subscription.models.js"

const  toggleSubscribeChannel = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!channelId) throw new ApiError(400,"channel not found")
    
    const channelSubscribe = await Subscription.findOne({
        subscriber:new mongoose.Types.ObjectId(req.user?._id),
        channel:new mongoose.Types.ObjectId(channelId)
    })
    if(!channelSubscribe){
        const newSubscribe = await Subscription.create({
            subscriber:new mongoose.Types.ObjectId(req.user?._id),
            channel:new mongoose.Types.ObjectId(channelId)
        })
        if(!newSubscribe) throw new ApiError(501,"Error in channel Subscribe")
        return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                newSubscribe,
                "channel Subscribed SuccessFully"
            )
        )
    }

    const deleteSubscription = await Subscription.findByIdAndDelete(channelSubscribe?._id);
    if(!deleteSubscription) throw new ApiError(501,"Error in Unsubscribe")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deleteSubscription,
            "channel Unsubscribe SuccessFully"
        )
    )
})

const getSubscribers = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    if(!channelId) throw new ApiError(400,"channel not found")
    
    const subscribers = await Subscription.find({
        channel:new mongoose.Types.ObjectId(channelId)
    }).populate("subscriber","username avatar")
    if(!subscribers.length) throw new ApiError(404,"No subscribers found for this channel")
    const count = subscribers.length
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {count,subscribers},
            "all subscriber are fetched"
        )
    )
})

const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const {subscriberId} = req.params
    if(!subscriberId) throw new ApiError(400,"subscriber not found")
    
    const channels = await Subscription.find({
        subscriber:new mongoose.Types.ObjectId(subscriberId)
    }).populate("channel","username avatar")
    if(!channels.length) throw new ApiError(404,"No channel subscribed channel found for this user")
    const count = channels.length
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {count,channels},
            "all subscriber are fetched"
        )
    )
})

export {
    toggleSubscribeChannel,
    getSubscribedChannels,
    getSubscribers
}