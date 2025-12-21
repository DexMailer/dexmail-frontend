import { isAddress } from 'viem';

export function isValidEthereumAddress(address: string): boolean {
    return isAddress(address);
}

export function isValidEmailIdentifier(identifier: string): boolean {
    // Simple regex to check if it looks like an email or an ETH address
    // We want to allow "name@domain.tld" OR "0x..."
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return isAddress(identifier) || emailRegex.test(identifier);
}

export function sanitizeInput(input: string): string {
    // Basic sanitization to remove common XSS/Injection vectors
    return input.replace(/[<>]/g, '');
}

export function isValidUrl(url: string, allowedProtocols = ['http:', 'https:']): boolean {
    try {
        const parsed = new URL(url);
        return allowedProtocols.includes(parsed.protocol);
    } catch {
        return false;
    }
}

export function isValidTraditionalEmail(email: string): boolean {
    // Stricter regex for traditional emails:
    // 1. Standard user part
    // 2. Domain must have at least one dot
    // 3. TLD must be at least 2 chars
    // 4. Domain parts cannot start/end with hyphen
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!strictEmailRegex.test(email)) return false;

    // Additional domain checks
    const domain = email.split('@')[1];
    if (domain.startsWith('-') || domain.endsWith('-')) return false;

    const parts = domain.split('.');
    if (parts.some(p => p.length === 0 || p.startsWith('-') || p.endsWith('-'))) return false;

    return true;
}
