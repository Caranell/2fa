import { Router } from 'express'

import * as DetectionController from './controller'

const detectionRouter = Router()

detectionRouter.post('/', DetectionController.detect)
detectionRouter.post('/venn-transaction', DetectionController.vennTransaction)

export { detectionRouter }
