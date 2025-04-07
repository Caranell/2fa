import { Router } from 'express'

import * as AuthController from './controller'

const authRouter = Router()

// Create a new user and generate TOTP
authRouter.post('/user', AuthController.createUser)

// Verify a TOTP token
authRouter.post('/verify', AuthController.verifyToken)

export { authRouter }
