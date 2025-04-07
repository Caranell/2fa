import * as OTPAuth from 'otpauth'

import { logger } from '@/app'

import { usersService } from '../db-module'

const TOTP_DEFAULT_SETTINGS = {
    issuer: 'VennNetwork',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
}

/**
 * AuthService
 *
 * Provides functionality for generating and verifying TOTP (Time-based One-Time Password)
 * for two-factor authentication.
 */
export class AuthService {
    /**
     * Generate a new secret for TOTP
     * @returns A base32 encoded secret string
     */
    private static generateSecret(): string {
        // Creating a new secret since Secret.generate() doesn't exist
        const secret = new OTPAuth.Secret({ size: 20 }).base32

        return secret
    }

    /**
     * Generate TOTP for a specific username
     * @param username The username to generate TOTP for
     * @returns An object containing the TOTP URI and secret
     */
    public static generateTOTP(username: string) {
        const secret = this.generateSecret()

        const totp = new OTPAuth.TOTP({
            ...TOTP_DEFAULT_SETTINGS,
            label: username,
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

    /**
     * Verify a token for a specific user
     * @param username The username to verify the token for
     * @param token The token to verify
     * @returns A promise that resolves to true if the token is valid, false otherwise
     */
    public static async verifyToken(username: string, token: string): Promise<boolean> {
        try {
            // Get the user's secret from the database
            const user = await usersService.getUserByUsername(username)

            if (!user) {
                throw new Error(`User ${username} not found`)
            }

            // Create a TOTP with the stored secret
            const totp = new OTPAuth.TOTP({
                ...TOTP_DEFAULT_SETTINGS,
                label: username,
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
}
