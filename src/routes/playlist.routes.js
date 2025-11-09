import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middlewre.js"
import {
    createPlaylist,
    addVideosInPlaylist,
    updatePlaylist,
    removeVideoFromPlaylist,
    getAllPlaylistOfUser,
    deletePlaylist,
    getPlaylistById,

} from "../controllers/playlist.controller.js"

const router = Router()
router.use(verifyJwt)

router.route("/add-playlist").post(createPlaylist)
router.route("/add-videos/:playlistId").post(addVideosInPlaylist)
router.route("/update/:playlistId").patch(updatePlaylist)
router.route("/remove-video/:playlistId/:videoId").patch(removeVideoFromPlaylist)
router.route("/getAllPlaylist/:userId").get(getAllPlaylistOfUser)
router.route("/delete/:playlistId").delete(deletePlaylist)
router.route("/playlist/:playlistId").get(getPlaylistById)



export default router;