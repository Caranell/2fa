import { createServer } from 'http'
import OTPAuth from 'otpauth'
import request from 'supertest'
import { parseEther } from 'viem'

import { app } from '@/app'
import { usersService } from '@/modules'
import { AuthService } from '@/modules/auth-module'
import { dbService } from '@/modules/db-module'
import { DetectionRequest, DetectionResponse } from '@/modules/detection-module/dtos'
import { HTTP_STATUS_CODES } from '@/types'

const ethereumAddress = '0xfdD055Cf3EaD343AD51f4C7d1F12558c52BaDFA5'
const zeroAddress = '0x0000000000000000000000000000000000000000'

const BASE_REQUEST_PAYLOAD: Partial<DetectionRequest> = {
    id: 'unique-id',
    detectorName: 'test-detector',
    chainId: 1,
    hash: 'some hash',
    protocolName: 'some protocol',
    protocolAddress: zeroAddress,
    trace: {
        blockNumber: 12345,
        from: ethereumAddress,
        to: ethereumAddress,
        transactionHash: 'some hash',
        input: 'input',
        output: 'output',
        gas: '100000',
        gasUsed: '100',
        value: '0', // Default to non-suspicious value
        pre: {
            [zeroAddress]: {
                balance: '0x..',
                nonce: 2,
            },
        },
        post: {
            [zeroAddress]: {
                balance: '0x..',
            },
        },
        logs: [
            {
                address: ethereumAddress,
                data: '0x...',
                topics: ['0x...'],
            },
        ],
        calls: [
            // Default to non-suspicious number of calls
            {
                from: ethereumAddress,
                to: ethereumAddress,
                input: 'input',
                output: 'output',
                gasUsed: '100',
                value: '10',
            },
        ],
    },
}

const TEST_USERNAME = 'testuser-2fa'
const TEST_SECRET = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD' // Test secret
let totp: OTPAuth.TOTP

describe('Detection service tests', () => {
    const testServer = createServer(app)

    beforeAll(async () => {
        // Ensure database is connected before tests
        await dbService.connect()

        // Create a test user with 2FA enabled
        try {
            await usersService.deleteUser(TEST_USERNAME) // Clean up if exists
        } catch (error) {
            // Ignore error if user doesn't exist, expected during first run or cleanup failure
        }
        await usersService.createUser(TEST_USERNAME, TEST_SECRET)
        totp = new OTPAuth.TOTP({
            issuer: 'ACME',
            label: 'AzureDiamond',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: TEST_SECRET,
        })

        // Start server on a different port
        await new Promise<void>(resolve => {
            testServer.listen(3002, '0.0.0.0', () => resolve())
        })
    })

    afterEach(async () => {
        // Clean up test data from MongoDB
        try {
            await usersService.deleteUser('testuser')
            await usersService.deleteUser(TEST_USERNAME)
        } catch (error) {
            console.error('Error cleaning up test data:', error)
        }
    })

    afterAll(async () => {
        // Close server and wait for connections to close
        await new Promise<void>(resolve => {
            testServer.close(() => resolve())
        })

        // Disconnect from database
        await dbService.disconnect()
    })

    test('validation - invalid base field', async () => {
        const response = await request(app)
            .post('/detect')
            .send({ ...BASE_REQUEST_PAYLOAD, protocolAddress: 'definitely not address' })
            .set('Content-Type', 'application/json')

        expect(response.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST)
    })

    test('validation - invalid nested field', async () => {
        const response = await request(app)
            .post('/detect')
            .send({
                ...BASE_REQUEST_PAYLOAD,
                trace: {
                    ...BASE_REQUEST_PAYLOAD.trace,
                    from: 'not valid address',
                    to: 'not valid as well',
                    logs: [
                        {
                            address: 'not address deeply nested',
                            data: '0x...',
                            topics: ['0x...'],
                        },
                    ],
                    // Ensure calls is defined even if we modify other trace parts
                    calls: BASE_REQUEST_PAYLOAD.trace?.calls,
                },
            })
            .set('Content-Type', 'application/json')

        expect(response.status).toBe(HTTP_STATUS_CODES.BAD_REQUEST)
        expect(response.body.message).toContain('trace.from')
        expect(response.body.message).toContain('trace.to')
        expect(response.body.message).toContain('trace.logs.0.address')
    })

    test('detect success - non-suspicious', async () => {
        // Use BASE_REQUEST_PAYLOAD which is non-suspicious by default
        const response = await request(app)
            .post('/detect')
            .send(BASE_REQUEST_PAYLOAD)
            .set('Content-Type', 'application/json')

        const body: DetectionResponse = response.body

        // Assert
        expect(response.status).toBe(HTTP_STATUS_CODES.OK)
        expect(body.detected).toBe(false)
        expect(body.message).toBeUndefined()
        expect(body.error).toBeFalsy()
    })

    test('detect success - suspicious (value), no 2FA', async () => {
        const payload = {
            ...BASE_REQUEST_PAYLOAD,
            trace: {
                ...BASE_REQUEST_PAYLOAD.trace,
                value: parseEther('2').toString(), // > 1 ETH
            },
        }
        const response = await request(app)
            .post('/detect')
            .send(payload)
            .set('Content-Type', 'application/json')

        const body: DetectionResponse = response.body

        // Assert
        expect(response.status).toBe(HTTP_STATUS_CODES.OK)
        expect(body.detected).toBe(true)
        expect(body.message).toContain('please use 2FA')
        expect(body.error).toBeFalsy()
    })

    test('detect success - suspicious (calls), no 2FA', async () => {
        const payload = {
            ...BASE_REQUEST_PAYLOAD,
            trace: {
                ...BASE_REQUEST_PAYLOAD.trace,
                calls: Array(11).fill(BASE_REQUEST_PAYLOAD.trace!.calls![0]), // > 10 calls
            },
        }
        const response = await request(app)
            .post('/detect')
            .send(payload)
            .set('Content-Type', 'application/json')

        const body: DetectionResponse = response.body

        // Assert
        expect(response.status).toBe(HTTP_STATUS_CODES.OK)
        expect(body.detected).toBe(true)
        expect(body.message).toContain('please use 2FA')
        expect(body.error).toBeFalsy()
    })

    test('detect success - suspicious (value), 2FA - invalid user, invalid token', async () => {
        const payload = {
            ...BASE_REQUEST_PAYLOAD,
            trace: {
                ...BASE_REQUEST_PAYLOAD.trace,
                value: parseEther('2').toString(), // > 1 ETH
            },
            additionalData: {
                username: 'invalid-user',
                token: '123456', // Invalid token
            },
        }
        const response = await request(app)
            .post('/detect')
            .send(payload)
            .set('Content-Type', 'application/json')

        const body: DetectionResponse = response.body

        // Assert
        expect(response.status).toBe(HTTP_STATUS_CODES.OK)
        expect(body.detected).toBe(true)
        expect(body.message).toContain('2FA token is invalid')
        expect(body.error).toBeFalsy()
    })

    test('detect success - suspicious (value), 2FA - valid user, invalid token', async () => {
        const payload = {
            ...BASE_REQUEST_PAYLOAD,
            trace: {
                ...BASE_REQUEST_PAYLOAD.trace,
                value: parseEther('2').toString(), // > 1 ETH
            },
            additionalData: {
                username: TEST_USERNAME,
                token: '123456', // Invalid token
            },
        }
        const response = await request(app)
            .post('/detect')
            .send(payload)
            .set('Content-Type', 'application/json')

        const body: DetectionResponse = response.body

        // Assert
        expect(response.status).toBe(HTTP_STATUS_CODES.OK)
        expect(body.detected).toBe(true)
        expect(body.message).toContain('2FA token is invalid')
        expect(body.error).toBeFalsy()
    })

    test('detect success - suspicious (value), 2FA - invalid user, valid token', async () => {
        const validToken = totp.generate()
        const payload = {
            ...BASE_REQUEST_PAYLOAD,
            trace: {
                ...BASE_REQUEST_PAYLOAD.trace,
                value: parseEther('2').toString(), // > 1 ETH
            },
            additionalData: {
                username: 'invalid-user',
                token: validToken, // Valid token, but invalid user
            },
        }
        const response = await request(app)
            .post('/detect')
            .send(payload)
            .set('Content-Type', 'application/json')

        const body: DetectionResponse = response.body

        // Assert
        // Even with a valid token structure, the auth service should reject it because the user doesn't exist
        expect(response.status).toBe(HTTP_STATUS_CODES.OK)
        expect(body.detected).toBe(true)
        expect(body.message).toContain('2FA token is invalid') // Service returns invalid token for non-existent user
        expect(body.error).toBeFalsy()
    })

    test('detect success - suspicious (value), 2FA - valid user, valid token', async () => {
        const validToken = totp.generate()
        const payload = {
            ...BASE_REQUEST_PAYLOAD,
            trace: {
                ...BASE_REQUEST_PAYLOAD.trace,
                value: parseEther('2').toString(), // > 1 ETH
            },
            additionalData: {
                username: TEST_USERNAME,
                token: validToken,
            },
        }
        const response = await request(app)
            .post('/detect')
            .send(payload)
            .set('Content-Type', 'application/json')

        const body: DetectionResponse = response.body

        // Assert
        expect(response.status).toBe(HTTP_STATUS_CODES.OK)
        expect(body.detected).toBe(false) // Should pass with valid 2FA
        expect(body.message).toContain('2FA token is valid')
        expect(body.error).toBeFalsy()
    })
})
