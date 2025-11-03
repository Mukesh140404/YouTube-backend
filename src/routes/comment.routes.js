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


router.route("/all-comments/:videoId").get(getAllComments)
router.route("/add-comment/:videoId").post(addComment)
router.route("/update-comment/:videoId").patch(updateComment)
router.route("/delete-comment/:videoId").delete(deleteComment)

export default router;