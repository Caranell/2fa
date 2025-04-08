import { parseEther } from 'viem'

import { AuthService } from '../auth-module'
import { DetectionRequest, DetectionResponse } from './dtos'

/**
 * DetectionService
 *
 * Implements a `detect` method that receives an enriched view of an
 * EVM compatible transaction (i.e. `DetectionRequest`)
 * and returns a `DetectionResponse`
 *
 * API Reference:
 * https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md
 */

export class DetectionService {
    public static async detect(request: DetectionRequest): Promise<DetectionResponse> {
        const isSuspicious = this.isSuspicious(request)
        const has2FA = this.has2FA(request)

        if (isSuspicious && has2FA) {
            const token = await AuthService.verifyToken(
                request.additionalData!.username!,
                request.additionalData!.token!,
            )

            if (!token) {
                return new DetectionResponse({
                    request,
                    detectionInfo: {
                        detected: true,
                        message: '2FA token is invalid, suspicious transaction blocked',
                    },
                })
            } else {
                return new DetectionResponse({
                    request,
                    detectionInfo: {
                        detected: false,
                        message: '2FA token is valid, suspicious transaction can pass',
                    },
                })
            }
        }

        return new DetectionResponse({
            request,
            detectionInfo: {
                detected: isSuspicious,
                message: isSuspicious
                    ? 'Transaction is suspicious, please use 2FA if you want it to pass'
                    : undefined,
            },
        })
    }

    // This is a POC implementation, more sophisticated approach should be used in production
    private static isSuspicious(request: DetectionRequest): boolean {
        const value = request.trace.value ? BigInt(request.trace.value) : BigInt(0)

        const numberOfCalls = request.trace.calls?.length ?? 0

        return value > parseEther('1') || numberOfCalls > 5
    }

    // does request have data to verify 2fa?
    private static has2FA(request: DetectionRequest): boolean {
        return Boolean(request.additionalData?.token) && Boolean(request.additionalData?.username)
    }
}
