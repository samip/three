import * as THREE from 'three';

const width = 32;
const height = 32;

export function getTextureImageData() {
    const size = width * height;
    const data = new Uint8ClampedArray(4 * size);
    // Fill with random black or white pixels
    for (let i = 0; i < size; i++) {
        const stride = i * 4;
        const value = Math.random() > 0.5 ? 255 : 0;
        data[stride] = value;     // r
        data[stride + 1] = value; // g
        data[stride + 2] = value; // b
        data[stride + 3] = 255; // a (useless)
    }
    return data;
}

export function generateLiveTexture() {
    const data = getTextureImageData();
    const texture = new THREE.DataTexture(
        data,
        width,
        height,
        THREE.RGBAFormat
    );
    texture.needsUpdate = true;
    return texture;
}

export function getCanvas() {
    const imageData = new ImageData(getTextureImageData(), 32, 32);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context) {
        context.putImageData(imageData, 0, 0);
    }
    return canvas;
}