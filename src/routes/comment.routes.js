import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middlewre.js"
import {
    getAllComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"

const router = Router()

router.use(verifyJwt)

router.route("/add-comment/:videoId").post(addComment)