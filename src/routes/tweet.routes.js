import {Router} from "express"
import {verifyJwt} from "../middlewares/auth.middlewre.js"
import {
    addTweet,
    getAllTweets,
    userTweets,
    getTweetById,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"

const router = Router()

router.use(verifyJwt)

router.route("/add-tweet").post(addTweet)
router.route("/all-tweets").get(getAllTweets)
router.route("/user-tweets/:userId").get(userTweets)
router.route("/tweet/:tweetId").get(getTweetById)
router.route("/update/:tweetId").patch(updateTweet)
router.route("/delete/:tweetId").delete(deleteTweet)


export default router
