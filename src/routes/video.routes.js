import {Router} from "express"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJwt} from '../middlewares/auth.middlewre.js';
import {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideoById
} from "../controllers/video.controller.js"


const router = Router()

router.use(verifyJwt)
router.route("/all-videos").get(getAllVideos)
router.route("/add-video").post(
    upload.fields([
        { name : "videoFile", maxCount : 1},
        { name : "thumbnail", maxCount : 1}])
    ,publishVideo)

router.route("/update/:videoId").patch(updateVideo)

router.route("/delete-video/:videoId").delete(deleteVideoById);
router.route("/video/:videoId").get(getVideoById);


export default router;