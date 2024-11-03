import * as THREE from 'three';

const width = 32;
const height = 32;

export enum LiveTextureType {
    BLACK_AND_WHITE,
    FULL_COLOR,
    FULL_GREEN,
}

function getTextureImageData(type: LiveTextureType) {
    const size = width * height;
    const data = new Uint8ClampedArray(4 * size);
    const alpha = 255;
    // Fill with random black or white pixels
    for (let i = 0; i < size; i++) {
        const stride = i * 4;
        switch (type) {
            case LiveTextureType.BLACK_AND_WHITE:
                const value = Math.random() > 0.5 ? 255 : 0;
                data[stride] = value;     // r
                data[stride + 1] = value; // g
                data[stride + 2] = value; // b
                data[stride + 3] = alpha; // a (useless)
                break;
            case LiveTextureType.FULL_COLOR:
                data[stride] = Math.floor(Math.random() * 256);  // r
                data[stride + 1] = Math.floor(Math.random() * 256); // g
                data[stride + 2] = Math.floor(Math.random() * 256); // b
                data[stride + 3] = alpha; // a (useless)
                break;
            case LiveTextureType.FULL_GREEN:
                data[stride] = 0;
                data[stride + 1] = 255;
                data[stride + 2] = 0;
                data[stride + 3] = alpha;
                break;
        }
    }
    return data;
}

export function generateLiveTexture(type: LiveTextureType) {
    const data = getTextureImageData(type);
    const texture = new THREE.DataTexture(
        data,
        width,
        height,
        THREE.RGBAFormat
    );
    texture.needsUpdate = true;
    return texture;
}

export function getCanvas(type: LiveTextureType) {
    const imageData = new ImageData(getTextureImageData(type), 32, 32);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context) {
        context.putImageData(imageData, 0, 0);
    }
    return canvas;
}