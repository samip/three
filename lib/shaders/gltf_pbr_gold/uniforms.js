import * as THREE from 'three';

const threeUniforms = {};
threeUniforms['u_worldMatrix'] = new THREE.Uniform(
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] 
) // undefined, matrix44

threeUniforms['u_viewProjectionMatrix'] = new THREE.Uniform(
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] 
) // undefined, matrix44

threeUniforms['u_worldInverseTransposeMatrix'] = new THREE.Uniform(
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] 
) // undefined, matrix44
threeUniforms['type'] = new THREE.Uniform(
    undefined 
) // undefined, integer

threeUniforms['backsurfaceshader'] = new THREE.Uniform(
    null 
) // undefined, surfaceshader

threeUniforms['displacementshader1'] = new THREE.Uniform(
    null 
) // undefined, displacementshader

threeUniforms['SR_gold_base_color'] = new THREE.Uniform(
    [0.9440000057220459,0.7760000228881836,0.37299999594688416] 
) // 0.944, 0.776, 0.373, color3

threeUniforms['SR_gold_metallic'] = new THREE.Uniform(
    1 
) // 1, float

threeUniforms['SR_gold_roughness'] = new THREE.Uniform(
    0.019999999552965164 
) // 0.019999999552965164, float

threeUniforms['SR_gold_occlusion'] = new THREE.Uniform(
    1 
) // 1, float

threeUniforms['SR_gold_transmission'] = new THREE.Uniform(
    0 
) // 0, float

threeUniforms['SR_gold_specular'] = new THREE.Uniform(
    1 
) // 1, float

threeUniforms['SR_gold_specular_color'] = new THREE.Uniform(
    [1,1,1] 
) // 1, 1, 1, color3

threeUniforms['SR_gold_ior'] = new THREE.Uniform(
    1.5 
) // 1.5, float

threeUniforms['SR_gold_alpha'] = new THREE.Uniform(
    1 
) // 1, float

threeUniforms['SR_gold_alpha_mode'] = new THREE.Uniform(
    0 
) // 0, integer

threeUniforms['SR_gold_alpha_cutoff'] = new THREE.Uniform(
    0.5 
) // 0.5, float

threeUniforms['SR_gold_iridescence'] = new THREE.Uniform(
    0 
) // 0, float

threeUniforms['SR_gold_iridescence_ior'] = new THREE.Uniform(
    1.2999999523162842 
) // 1.2999999523162842, float

threeUniforms['SR_gold_iridescence_thickness'] = new THREE.Uniform(
    100 
) // 100, float

threeUniforms['SR_gold_sheen_color'] = new THREE.Uniform(
    [0,0,0] 
) // 0, 0, 0, color3

threeUniforms['SR_gold_sheen_roughness'] = new THREE.Uniform(
    0 
) // 0, float

threeUniforms['SR_gold_clearcoat'] = new THREE.Uniform(
    0 
) // 0, float

threeUniforms['SR_gold_clearcoat_roughness'] = new THREE.Uniform(
    0 
) // 0, float

threeUniforms['SR_gold_emissive'] = new THREE.Uniform(
    [0,0,0] 
) // 0, 0, 0, color3

threeUniforms['SR_gold_emissive_strength'] = new THREE.Uniform(
    1 
) // 1, float

threeUniforms['SR_gold_thickness'] = new THREE.Uniform(
    0 
) // 0, float

threeUniforms['SR_gold_attenuation_distance'] = new THREE.Uniform(
    undefined 
) // undefined, float

threeUniforms['SR_gold_attenuation_color'] = new THREE.Uniform(
    [1,1,1] 
) // 1, 1, 1, color3

threeUniforms['u_alphaThreshold'] = new THREE.Uniform(
    0.0010000000474974513 
) // 0.0010000000474974513, float

threeUniforms['u_envMatrix'] = new THREE.Uniform(
    [-1,0,0,0,0,1,0,0,0,0,-1,0,0,0,0,1] 
) // -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, matrix44

threeUniforms['u_envRadiance'] = new THREE.Uniform(
    null 
) // undefined, filename

threeUniforms['u_envLightIntensity'] = new THREE.Uniform(
    1 
) // 1, float

threeUniforms['u_envRadianceMips'] = new THREE.Uniform(
    1 
) // 1, integer

threeUniforms['u_envRadianceSamples'] = new THREE.Uniform(
    16 
) // 16, integer

threeUniforms['u_envIrradiance'] = new THREE.Uniform(
    null 
) // undefined, filename

threeUniforms['u_refractionTwoSided'] = new THREE.Uniform(
    undefined 
) // undefined, boolean

threeUniforms['u_viewPosition'] = new THREE.Uniform(
    [0,0,0] 
) // undefined, vector3

threeUniforms['u_numActiveLightSources'] = new THREE.Uniform(
    0 
) // 0, integer
export default threeUniforms;