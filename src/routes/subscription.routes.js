import { Router } from "express";
import {
    toggleSubscribeChannel,
    getSubscribedChannels,
    getSubscribers
} from "../controllers/subscription.controller.js"
import { verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJwt)

router.route("/subscribe/:channelId").post(toggleSubscribeChannel)
router.route("/subscribers/:channelId").get(getSubscribers)
router.route("/subscribeds/:subscriberId").get(getSubscribedChannels)


export default router;