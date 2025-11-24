export const PINATA_API_URL = 'https://api.pinata.cloud';

export async function uploadJSONToIPFS(data: any) {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
        throw new Error('PINATA_JWT is not defined');
    }

    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
            pinataContent: data,
            pinataMetadata: {
                name: `email-${Date.now()}`,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    return response.json();
}

export async function uploadFileToIPFS(file: File | Blob) {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
        throw new Error('PINATA_JWT is not defined');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('pinataMetadata', JSON.stringify({
        name: `attachment-${Date.now()}`,
    }));
    formData.append('pinataOptions', JSON.stringify({
        cidVersion: 1,
    }));

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    return response.json();
}
