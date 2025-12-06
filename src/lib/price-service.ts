
interface PriceData {
    price: number;
    image: string;
}

interface PriceCache {
    data: PriceData;
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'eth_price_data_cache';

export const priceService = {
    async getEthPrice(): Promise<PriceData> {
        // Check in-memory/localStorage cache first
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached) as PriceCache;
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        console.log('[PriceService] Using cached ETH data:', data);
                        return data;
                    }
                }
            } catch (e) {
                console.warn('[PriceService] Failed to read cache', e);
            }
        }

        try {
            console.log('[PriceService] Fetching ETH data from CoinGecko...');
            const response = await fetch(
                'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum'
            );

            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data && data.length > 0) {
                const result: PriceData = {
                    price: data[0].current_price,
                    image: data[0].image
                };

                // Update cache
                if (typeof window !== 'undefined') {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        data: result,
                        timestamp: Date.now()
                    }));
                }
                return result;
            }
            return { price: 0, image: '' };
        } catch (error) {
            console.error('[PriceService] Error fetching ETH data:', error);
            return { price: 0, image: '' };
        }
    }
};
