import { Router } from 'express'

import { appRouter } from '@/modules/app-module/router'
import { authRouter } from '@/modules/auth-module/router'
import { detectionRouter } from '@/modules/detection-module/router'

const router = Router()

/* ASSIGN EACH ROUTER TO DEDICATED SUBROUTE */
router.use('/app', appRouter)
router.use('/detect', detectionRouter)
router.use('/auth', authRouter)

export { router }
