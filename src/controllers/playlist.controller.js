import mongoose from "mongoose";
import { 
            asyncHandler,
            ApiError,
            ApiResponse,
        } from "../utils/index.js";
import { Playlist } from "../models/playlist.models.js"




//-----------playlist controllers-----------

//create playlist

const createPlaylist = asyncHandler( async (req,res) => {
    const {name, description} = req.body
    if([name,description].some((feild)=>feild?.trim()==="")){
        throw new ApiError(400,"All feilds are required")
    }
    const existsPlaylist = await Playlist.findOne({name:name})
    if(existsPlaylist) throw new ApiError(409,"playlist already exists")
    
    const newPlaylist = await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })

    if(!newPlaylist) throw new ApiError(500,"Some error in creating playlist")
    return res
    .status(200)
    .json(
        new ApiResponse(
            201,
            newPlaylist,
            "playlist created successfully"
        )
    )

})

//add video to playlist

// const addVideoInPlaylist = asyncHandler( async (req,res) => {
//     const {playlistId} = req.params
//     if(!playlistId) throw new ApiError(400,"playlist not valid")

//     const {videoId} = req.body
//     if(!videoId) throw new ApiError(400,"video is required to add")

//     // const playlist = await Playlist.findById(playlistId)
//     // if(!playlist) throw new ApiError(404,"playlist not found")
    
//     // if(req.user?._id.toString()!==playlist.owner.toString()){
//     //     throw new ApiError(403,"you are not authorized for add video in this playlist")
//     // }
//    const playlist = await Playlist.findOneAndUpdate(
//     {
//         $and: [
//             { _id: new mongoose.Types.ObjectId(playlistId) },
//             { owner: req.user?._id }
//         ]
//     },
//     {
//         $addToSet: { videos: new mongoose.Types.ObjectId(videoId) } // videoId ko add karega agar already nahi hai
//     },
//     {
//         new: true // updated playlist return karega
//     }
//     );
//     if(!playlist) throw new ApiError(404,"playlist not found")
//     return res
//     .status(200)
//     .json(
//         new ApiResponse(
//             200,
//             playlist,
//             "video successfully add in playlist"
//         )
//     )    
// })
const addVideosInPlaylist = asyncHandler( async (req,res) => {
    const {playlistId} = req.params
    if(!playlistId) throw new ApiError(400,"playlist not valid")

    const {videoIds} = req.body
    if (!Array.isArray(videoIds) || videoIds.length === 0)
        throw new ApiError(400, "At least one video ID required");
    // const playlist = await Playlist.findById(playlistId)
    // if(!playlist) throw new ApiError(404,"playlist not found")
    
    // if(req.user?._id.toString()!==playlist.owner.toString()){
    //     throw new ApiError(403,"you are not authorized for add video in this playlist")
    // }
   const playlist = await Playlist.findOneAndUpdate(
    {
        $and: [
            { _id: new mongoose.Types.ObjectId(playlistId) },
            { owner: req.user?._id }
        ]
    },
    {
        $addToSet: { videos : { $each : new mongoose.Types.ObjectId(videoIds) } } // videoId ko add karega agar already nahi hai
    },
    {
        new: true // updated playlist return karega
    }
    );
    if(!playlist) throw new ApiError(404,"playlist not found")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "videos successfully add in playlist"
        )
    )    
})

//update playlist  

const updatePlaylist = asyncHandler( async (req,res) => {
    const {playlistId } = req.params
    if(!playlistId) throw new ApiError(400,"not valid playlist")
    const {name,description} = req.body
    if([name,description].some((field)=>(field?.trim()===""))){
        throw new ApiError(400,"All feilds are required")
    }
    const playlist = await Playlist.findOneAndUpdate(
        {
            $and:[
                {owner:new mongoose.Types.ObjectId(req.user?._id)},
                {_id:new mongoose.Types.ObjectId(playlistId)}
            ]
        },
        {
            $set:{
                name,
                description,
            }
        },
        { new : true }
    )
    if(!playlist) throw new ApiError(404,"you are not authenticated or unknown playlist")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist update successfully"
        )
    )
})

//remove video from playlist

const removeVideoFromPlaylist = asyncHandler( async (req,res) => {
    const {playlistId,videoId} = req.params
    if([playlistId,videoId].some((feild)=>feild?.trim()==="")){
        throw new ApiError(400,"unknown video and playlist")
    }
    const newPlaylist = await Playlist.findOneAndUpdate(
        {
            $and:[
                {owner:new mongoose.Types.ObjectId(req.user?._id)},
                {_id:new mongoose.Types.ObjectId(playlistId)}
            ]
        },
        {
            $pull:{
                videos : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            new : true
        }
    )
    if(!newPlaylist) throw new ApiError(404,"not authenticate or unknown video and playlist")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newPlaylist,
            "video remove successfully from playlist"
        )
    )
})

//get all playlists for a user

const getAllPlaylistOfUser = asyncHandler( async (req,res) => {
    const {userId} = req.params
    if(!userId)throw new ApiError(400,"not valid user")
    
    const playlistsOfUser = await Playlist.find({
        owner:new mongoose.Types.ObjectId(userId)
    })

    if(!playlistsOfUser.length) throw new ApiError(404,"playlist not exists for this user")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistsOfUser,
            "playlists fetched successfully"
        )
    )
})

//delete playlist

const deletePlaylist = asyncHandler(async (req,res) => {
    const {playlistId} = req.params
    if(!playlistId) throw new ApiError(400,"playlist not valid")
    
    const deletedPlaylist = await Playlist.findOneAndDelete(
        {
            $and:[
                {_id:new mongoose.Types.ObjectId(playlistId)},
                {owner:new mongoose.Types.ObjectId(req.user?._id)}
            ]
        }
    )
    if(!deletedPlaylist) throw new ApiError(404,"not authenticated or unknown Playlist")
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "playlist delete successfully"
        )
    )
})

//get playlist by id

const getPlaylistById = asyncHandler( async (req,res) => {
    const {playlistId} = req.params
    if(!playlistId) throw new ApiError(400,"playlist not valid")
    
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404,"Playlist Not Found")
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "playlist fetched successfully"
        )
    )
})

export {
    createPlaylist,
    addVideosInPlaylist,
    updatePlaylist,
    removeVideoFromPlaylist,
    getAllPlaylistOfUser,
    deletePlaylist,
    getPlaylistById,

}
