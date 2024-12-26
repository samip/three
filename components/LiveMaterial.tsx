import { THREE } from 'expo-three';

export class LiveMaterial extends THREE.ShaderMaterial {
  animationFrameHandle: number | null = null;

  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        stripeWidth: { value: 16.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float stripeWidth;
        varying vec2 vUv;

        void main() {
          // Scale UV coordinates to -128 to 128 range
          vec2 pos = (vUv * 256.0) - 128.0;
          
          // Calculate animated position
          float offset = -128.0 + (mod(time, 1.0) * 256.0);
          
          // Calculate distance from diagonal
          float distanceFromDiagonal = abs((pos.x - offset) - pos.y);
          
          // Create stripe pattern
          float color = distanceFromDiagonal <= stripeWidth ? 0.0 : 1.0;
          
          gl_FragColor = vec4(vec3(color), 1.0);
        }
      `,
    });

    // Make sure texture is marked for update
    this.needsUpdate = true;
    this.update();
  }

  dispose() {
    console.log('dispose');
    if (this.animationFrameHandle) {
      cancelAnimationFrame(this.animationFrameHandle);
      this.animationFrameHandle = null;
    }
  }

  update() {
    const update = this.update.bind(this);
    this.uniforms.time.value += 0.01;
    this.uniforms.stripeWidth.value += 0.25;
    this.needsUpdate = true; // Important!
    this.animationFrameHandle = requestAnimationFrame(update);
  }
}
