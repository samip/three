import { Float } from 'react-native/Libraries/Types/CodegenTypes';
import * as THREE from 'three';

const width = 128;
const height = 128;

export enum LiveTextureType {
  BLACK_AND_WHITE,
  FULL_COLOR,
  FULL_GREEN,
  DIAGONAL,
}

function getTextureImageData(type: LiveTextureType, position: Float = 0.0) {
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
      case LiveTextureType.DIAGONAL:
        const color = (x: number, y: number, position: Float) => {
          let pos = -128 + (position * 256);
          const distanceFromDiagonal = Math.abs( (x - pos) - (y) );
          return distanceFromDiagonal >= stripeWidth ? 0 : 255;
        };

        const stripeWidth = 32;
        const x = i % width;
        const y = Math.floor(i / width);
        // generate diagonal black and white strip
        const colorValue = color(x, y, position);
        data[stride] = colorValue;
        data[stride + 1] = colorValue;
        data[stride + 2] = colorValue;
        data[stride + 3] = alpha;
        break;
    }
  }
  return data;
}

export function animateTexture(mesh: THREE.Mesh, offset: number = 0.0) {
  if (mesh.material instanceof THREE.MeshStandardMaterial) {
    mesh.material.alphaMap = generateLiveTexture(LiveTextureType.DIAGONAL, offset);
    if (offset >= 1.0) {
      offset = 0.0;
    } else {
      offset += 0.01;
    }
    setTimeout(() => {
      animateTexture(mesh, offset);
    }, 100);
  }
}

const cachedTextures = new Map<string, THREE.Texture>();
export function generateLiveTexture(type: LiveTextureType, position: Float = 0.0) {
  const cacheKey = `${type}-${position}`;
  if (cachedTextures.has(cacheKey)) {
    return (cachedTextures.get(cacheKey) as THREE.Texture);
  }
  const data = getTextureImageData(type, position);
  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat
  );
  cachedTextures.set(cacheKey, texture);
  texture.needsUpdate = true;
  return texture;
}

export function getCanvas(type: LiveTextureType, position: Float = 0.0) {
  const imageData = new ImageData(getTextureImageData(type, position), width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) {
    context.putImageData(imageData, 0, 0);
  }
  return canvas;
}

export function dumpTexture(type: LiveTextureType, position: Float = 0.0) {
  const canvas = getCanvas(type, position);
  document.body.prepend(canvas);
}