import * as OTPAuth from 'otpauth'

import { logger } from '@/app'

import { usersService } from '../db-module'

// Generate a new secret for TOTP
const generateSecret = (): string => {
    // Creating a new secret since Secret.generate() doesn't exist
    const secret = new OTPAuth.Secret({ size: 20 }).base32

    return secret
}

// Generate TOTP for a specific username
const generateTOTP = (username: string) => {
    const secret = generateSecret()

    const totp = new OTPAuth.TOTP({
        issuer: 'VennNetwork',
        label: username,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
    })

    // Store the username and OTP secret in MongoDB
    usersService.createUser(username, secret).catch((error: Error) => {
        logger.error(`Failed to save user OTP secret: ${error.message}`)
    })

    return {
        uri: totp.toString(),
        secret,
    }
}

// Verify a token for a specific user
const verifyToken = async (username: string, token: string): Promise<boolean> => {
    try {
        // Get the user's secret from the database
        const user = await usersService.getUserByUsername(username)
        if (!user) {
            throw new Error(`User ${username} not found`)
        }

        // Create a TOTP with the stored secret
        const totp = new OTPAuth.TOTP({
            issuer: 'VennNetwork',
            label: username,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: user.otpSecret,
        })

        // Validate with a window of 1 to allow for slight time differences
        const delta = totp.validate({ token, window: 1 })

        // If delta is null, the token is invalid
        return delta !== null
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.error(`Error verifying token: ${errorMessage}`)
        return false
    }
}

export { generateSecret, generateTOTP, verifyToken }
