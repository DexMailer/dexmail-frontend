import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

type RateLimitOptions = {
    uniqueTokenPerInterval?: number;
    interval?: number;
    // Botnet protection options
    enableFingerprinting?: boolean;
    enableExponentialBackoff?: boolean;
    enableGlobalLimit?: boolean;
    globalLimit?: number;
    maxViolations?: number;
    banDuration?: number;
};

type ClientRecord = {
    count: number;
    timestamps: number[];
    violations: number;
    bannedUntil: number;
    fingerprints: Set<string>;
    lastRequestTime: number;
    suspicionScore: number;
};

type GlobalState = {
    totalRequests: number;
    windowStart: number;
};

/**
 * Generate a fingerprint from request headers to identify clients beyond IP
 */
export function generateFingerprint(headers: {
    userAgent?: string | null;
    acceptLanguage?: string | null;
    acceptEncoding?: string | null;
    accept?: string | null;
    connection?: string | null;
    cacheControl?: string | null;
}): string {
    const components = [
        headers.userAgent || '',
        headers.acceptLanguage || '',
        headers.acceptEncoding || '',
        headers.accept || '',
        headers.connection || '',
        headers.cacheControl || '',
    ].join('|');

    return crypto.createHash('sha256').update(components).digest('hex').slice(0, 16);
}

/**
 * Calculate suspicion score based on request patterns
 */
function calculateSuspicionScore(record: ClientRecord, now: number): number {
    let score = 0;

    // High request frequency (requests too close together)
    if (record.lastRequestTime && now - record.lastRequestTime < 50) {
        score += 20; // Less than 50ms between requests is suspicious
    } else if (record.lastRequestTime && now - record.lastRequestTime < 100) {
        score += 10;
    }

    // Multiple fingerprints from same IP (rotating user agents)
    if (record.fingerprints.size > 5) {
        score += 15 * (record.fingerprints.size - 5);
    }

    // Previous violations
    score += record.violations * 25;

    // Burst detection: many requests in very short time
    const recentRequests = record.timestamps.filter(t => now - t < 1000).length;
    if (recentRequests > 10) {
        score += (recentRequests - 10) * 5;
    }

    // Consistent intervals (bot-like behavior)
    if (record.timestamps.length >= 3) {
        const intervals: number[] = [];
        for (let i = 1; i < Math.min(record.timestamps.length, 10); i++) {
            intervals.push(record.timestamps[i] - record.timestamps[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
        // Very low variance = consistent timing = likely bot
        if (variance < 100 && intervals.length >= 5) {
            score += 30;
        }
    }

    return Math.min(score, 100);
}

export function rateLimit(options?: RateLimitOptions) {
    const interval = options?.interval || 60000;
    const enableFingerprinting = options?.enableFingerprinting ?? true;
    const enableExponentialBackoff = options?.enableExponentialBackoff ?? true;
    const enableGlobalLimit = options?.enableGlobalLimit ?? true;
    const globalLimit = options?.globalLimit || 10000; // Max requests per interval globally
    const maxViolations = options?.maxViolations || 5;
    const banDuration = options?.banDuration || 15 * 60 * 1000; // 15 minutes default ban

    // Main token cache for rate limiting
    const tokenCache = new LRUCache<string, ClientRecord>({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: interval,
    });

    // Track banned IPs separately with longer TTL
    const bannedCache = new LRUCache<string, { until: number; violations: number }>({
        max: 10000,
        ttl: banDuration * 2,
    });

    // Global rate limiting state
    const globalState: GlobalState = {
        totalRequests: 0,
        windowStart: Date.now(),
    };

    // Suspicious IP tracking (for coordinated attacks)
    const suspiciousPatterns = new LRUCache<string, number>({
        max: 1000,
        ttl: 5 * 60 * 1000, // 5 minutes
    });

    return {
        check: (
            limit: number,
            token: string,
            fingerprint?: string
        ): {
            isRateLimited: boolean;
            currentUsage: number;
            limit: number;
            remaining: number;
            isBanned: boolean;
            banExpiresIn?: number;
            suspicionScore: number;
            reason?: string;
        } => {
            const now = Date.now();

            // Check if globally rate limited
            if (enableGlobalLimit) {
                if (now - globalState.windowStart > interval) {
                    globalState.totalRequests = 0;
                    globalState.windowStart = now;
                }
                globalState.totalRequests++;

                if (globalState.totalRequests > globalLimit) {
                    return {
                        isRateLimited: true,
                        currentUsage: globalState.totalRequests,
                        limit: globalLimit,
                        remaining: 0,
                        isBanned: false,
                        suspicionScore: 0,
                        reason: 'global_limit_exceeded',
                    };
                }
            }

            // Check if IP is banned
            const banRecord = bannedCache.get(token);
            if (banRecord && banRecord.until > now) {
                return {
                    isRateLimited: true,
                    currentUsage: limit,
                    limit,
                    remaining: 0,
                    isBanned: true,
                    banExpiresIn: banRecord.until - now,
                    suspicionScore: 100,
                    reason: 'ip_banned',
                };
            }

            // Get or create client record
            let record = tokenCache.get(token);
            if (!record) {
                record = {
                    count: 0,
                    timestamps: [],
                    violations: banRecord?.violations || 0,
                    bannedUntil: 0,
                    fingerprints: new Set(),
                    lastRequestTime: 0,
                    suspicionScore: 0,
                };
                tokenCache.set(token, record);
            }

            // Track fingerprint if enabled
            if (enableFingerprinting && fingerprint) {
                record.fingerprints.add(fingerprint);
            }

            // Update timestamps (keep last 100 for pattern analysis)
            record.timestamps.push(now);
            if (record.timestamps.length > 100) {
                record.timestamps = record.timestamps.slice(-100);
            }

            // Calculate suspicion score
            record.suspicionScore = calculateSuspicionScore(record, now);

            // Update last request time
            record.lastRequestTime = now;

            // Increment count
            record.count++;

            // Calculate effective limit based on suspicion score
            let effectiveLimit = limit;
            if (record.suspicionScore > 50) {
                effectiveLimit = Math.max(5, Math.floor(limit * 0.5)); // Reduce limit by 50% for suspicious clients
            } else if (record.suspicionScore > 25) {
                effectiveLimit = Math.max(10, Math.floor(limit * 0.75)); // Reduce by 25%
            }

            // Apply exponential backoff for repeat offenders
            if (enableExponentialBackoff && record.violations > 0) {
                const backoffMultiplier = Math.pow(2, Math.min(record.violations, 5));
                effectiveLimit = Math.max(1, Math.floor(effectiveLimit / backoffMultiplier));
            }

            const isRateLimited = record.count >= effectiveLimit;

            // Track violations and potentially ban
            if (isRateLimited) {
                record.violations++;

                // Check for subnet-level patterns (first 3 octets for IPv4)
                const subnet = token.split('.').slice(0, 3).join('.');
                if (subnet !== token) {
                    const subnetCount = (suspiciousPatterns.get(subnet) || 0) + 1;
                    suspiciousPatterns.set(subnet, subnetCount);

                    // If many IPs from same subnet are hitting limits, increase suspicion
                    if (subnetCount > 10) {
                        record.suspicionScore = Math.min(100, record.suspicionScore + 20);
                    }
                }

                // Ban if too many violations
                if (record.violations >= maxViolations) {
                    const banTime = enableExponentialBackoff
                        ? banDuration * Math.pow(2, Math.min(record.violations - maxViolations, 4))
                        : banDuration;

                    bannedCache.set(token, {
                        until: now + banTime,
                        violations: record.violations,
                    });

                    return {
                        isRateLimited: true,
                        currentUsage: record.count,
                        limit: effectiveLimit,
                        remaining: 0,
                        isBanned: true,
                        banExpiresIn: banTime,
                        suspicionScore: record.suspicionScore,
                        reason: 'violation_ban',
                    };
                }
            }

            return {
                isRateLimited,
                currentUsage: record.count,
                limit: effectiveLimit,
                remaining: isRateLimited ? 0 : effectiveLimit - record.count,
                isBanned: false,
                suspicionScore: record.suspicionScore,
                reason: isRateLimited ? 'rate_limited' : undefined,
            };
        },

        // Method to manually ban an IP
        ban: (token: string, duration?: number) => {
            bannedCache.set(token, {
                until: Date.now() + (duration || banDuration),
                violations: maxViolations,
            });
        },

        // Method to unban an IP
        unban: (token: string) => {
            bannedCache.delete(token);
        },

        // Get stats for monitoring
        getStats: () => ({
            globalRequests: globalState.totalRequests,
            trackedClients: tokenCache.size,
            bannedClients: bannedCache.size,
        }),
    };
}

// Legacy simple rate limit for backward compatibility
export function simpleRateLimit(options?: RateLimitOptions) {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    });

    return {
        check: (limit: number, token: string) => {
            const tokenCount = (tokenCache.get(token) as number[]) || [0];
            if (tokenCount[0] === 0) {
                tokenCache.set(token, tokenCount);
            }
            tokenCount[0] += 1;

            const currentUsage = tokenCount[0];
            const isRateLimited = currentUsage >= limit;

            return {
                isRateLimited,
                currentUsage,
                limit,
                remaining: isRateLimited ? 0 : limit - currentUsage,
            };
        },
    };
}
