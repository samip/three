import { THREE } from 'expo-three';
import data from '../assets/materials/carpaint.matx.json';
import threeUniforms from './shaders/gltf_pbr_gold/uniforms';
import vShader from './shaders/gltf_pbr_gold/vertex';
import fShader from './shaders/gltf_pbr_gold/fragment';

export function getMaterialXTexture(radianceTexture: THREE.Texture, irradianceTexture: THREE.Texture) {
  const otherUniforms = {
    u_numActiveLightSources: { value: 0 },
    // u_lightData: { value: lightData },
    u_envMatrix: { value:
        new THREE.Matrix4().makeRotationY(Math.PI / 2)
    },
    u_envRadiance: { value: radianceTexture },
    u_envRadianceMips: {
        value:
        Math.trunc(
            Math.log2(
                Math.max(
                    radianceTexture.image.width,
                    radianceTexture.image.height,
                ),
            ),
        ) + 1,
    },
    u_envRadianceSamples: { value: 16 },
    u_envIrradiance: { value: irradianceTexture },
    u_refractionEnv: { value: true },
  };

  const uniforms = {
      ...threeUniforms,
      ...otherUniforms,
  };
  const materialParams = {
      glslVersion: THREE.GLSL3,
      uniforms: uniforms,
      vertexShader: vShader,
      fragmentShader: fShader,
      transparent: false,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneMinusSrcAlphaFactor,
      blendDst: THREE.SrcAlphaFactor,
      side: THREE.DoubleSide,
  };
  return new THREE.RawShaderMaterial(materialParams);
}
