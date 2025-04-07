import { Router } from 'express'

/* IMPORT ALL YOUR ROUTERS */
import { appRouter, authRouter, detectionRouter } from '@/modules'

const router = Router()

/* ASSIGN EACH ROUTER TO DEDICATED SUBROUTE */
router.use('/app', appRouter)
router.use('/detect', detectionRouter)
router.use('/auth', authRouter)

export { router }
