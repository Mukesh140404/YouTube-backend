import { Router } from "express";
import {verifyJwt} from "../middlewares/auth.middleware.js"
import {
    addViewOnVideo,
    getAllViewsForVideo
} from "../controllers/view.controller.js"

const router = Router()
router.use(verifyJwt)

router.route("/add-view/:videoId").post(addViewOnVideo)
router.route("/views/:videoId").get(getAllViewsForVideo)

export default router;