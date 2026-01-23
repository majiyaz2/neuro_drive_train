/**
 * @title IpfsService
 * @dev Handles model storage via Pinata IPFS.
 */
export class IpfsService {
    private pinataApiKey: string | null;
    private gateway: string;

    constructor(pinataApiKey: string | null = null) {
        this.pinataApiKey = pinataApiKey || process.env.NEXT_PUBLIC_PINATA_JWT || null;
        this.gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    }

    /**
     * @dev Upload model JSON to Pinata.
     */
    async uploadModel(modelData: any): Promise<string> {
        console.log('Uploading model to IPFS...', this.pinataApiKey);
        if (!this.pinataApiKey) {
            console.warn('No Pinata API Key. Simulating upload.');
            return this._simulateUpload(modelData);
        }

        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.pinataApiKey}`
            },
            body: JSON.stringify({
                pinataContent: modelData,
                pinataMetadata: {
                    name: `NeuroDrive_Model_${Date.now()}`
                }
            })
        });

        if (!response.ok) throw new Error('IPFS storage failed');
        const result = await response.json();
        return result.IpfsHash;
    }

    /**
     * @dev Fetch model from IPFS with fallback gateways.
     */
    async fetchModel(cid: string): Promise<any> {
        const primaryGateway = this.gateway.endsWith('/') ? this.gateway : `${this.gateway}/`;
        const gateways = [
            primaryGateway,
            'https://gateway.pinata.cloud/ipfs/',
            'https://cloudflare-ipfs.com/ipfs/',
            'https://ipfs.io/ipfs/',
            'https://dweb.link/ipfs/'
        ];

        // Remove duplicates and ensure primary is first
        const uniqueGateways = Array.from(new Set(gateways));

        for (const gw of uniqueGateways) {
            try {
                const url = `${gw}${cid}`;
                console.log(`Attempting to fetch from IPFS: ${url}`);

                // Using a shorter timeout for fallback logic
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per gateway

                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    return await response.json();
                }
                console.warn(`Gateway ${gw} returned status ${response.status}`);
            } catch (err) {
                console.warn(`Failed to fetch from gateway ${gw}:`, err);
            }
        }

        throw new Error(`Failed to fetch model ${cid} from all available IPFS gateways.`);
    }

    private _simulateUpload(data: any): Promise<string> {
        const hash = 'QmSimulation' + Math.random().toString(36).substring(7);
        console.log('Simulated Hash:', hash);
        return Promise.resolve(hash);
    }
}
