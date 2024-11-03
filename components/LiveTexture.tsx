import * as THREE from 'three';

export function generateLiveTexture() {
    const width = 32;
    const height = 32;
    const size = width * height;
    const data = new Uint8Array(3 * size);

    // Fill with random black or white pixels
    for (let i = 0; i < size; i++) {
        const stride = i * 3;
        const value = Math.random() > 0.5 ? 255 : 0;
        data[stride] = value;     // r
        data[stride + 1] = value; // g
        data[stride + 2] = value; // b
    }

    const texture = new THREE.DataTexture(
        data,
        width,
        height,
        THREE.RGBFormat
    );
    texture.needsUpdate = true;
    return texture;
}
