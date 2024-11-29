import { THREE } from 'expo-three';

export async function setMaterial(mesh: THREE.Mesh, map: THREE.Texture, camera: THREE.Camera) {
  const tex = map;
  setTextureParameters(tex);
  const texSize = new THREE.Vector2(tex.image.width, tex.image.height);

  const emptyShader = {
    glslVersion: THREE.GLSL3,
    uniforms: {
      ...getDynamicUniforms(mesh, camera),
      tex: { value: tex },
      tex_size: { value: texSize },
      //  toddo: set correctly
      directionalLights: { value: [new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1)] },
      directionalLightDirections: { value: [new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 1)] },
      directionalLightIntensities: { value: [1, 1, 1] }
    },
    vertexShader: `
        in vec3 position;
        in vec3 normal;

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat3 normalMatrix;

        out vec3 vNormal;
        out vec3 vWorldPosition;

        void main() {
            vNormal = normalMatrix * normal;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
    fragmentShader: `
        precision highp float;
        
        in vec3 vNormal;
        in vec3 vWorldPosition;
        
        uniform sampler2D tex;
        uniform vec2 tex_size;
        uniform vec3 directionalLightDirections[3];
        uniform vec3 directionalLightIntensities[3];

        layout(location = 0) out vec4 out_color;

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 lighting = vec3(0.1); // ambient
            
            for(int i = 0; i < 3; i++) {
                vec3 lightDir = normalize(directionalLightDirections[i]);
                float diff = max(dot(normal, lightDir), 0.0);
                lighting += diff * directionalLightIntensities[i];
            }

            vec4 texColor = texture(tex, gl_FragCoord.xy / tex_size);
            out_color = vec4(texColor.rgb * lighting, texColor.a);
        }
      `,
    transparent: false,
    blending: THREE.NoBlending,
    side: THREE.DoubleSide,
  };
  const material = new THREE.RawShaderMaterial(emptyShader);
  mesh.material = material;
  return mesh;
}

  // TODO: compare with https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/javascript/MaterialXView/source/viewer.js#L252
  // TODO: figure out why uniforms dont change after camera moves
function getDynamicUniforms(mesh: THREE.Mesh, camera: THREE.Camera) {
  const normalMatRef = new THREE.Matrix3();
  const uniforms = {
    modelMatrix: new THREE.Uniform(mesh.matrixWorld),
      viewMatrix: new THREE.Uniform(camera.matrixWorldInverse),
      projectionMatrix: new THREE.Uniform(camera.projectionMatrix),
      normalMatrix: new THREE.Uniform(normalMatRef.getNormalMatrix(mesh.matrixWorld)),
    };
    
    return uniforms;
  }
function setTextureParameters(texture: THREE.Texture, flipY = true, generateMipmaps = true) {
  const getMinFilter = (nearest: boolean, generateMipmaps: boolean) => {
    if (nearest) {
      return generateMipmaps
        ? THREE.NearestMipMapNearestFilter
        : THREE.NearestFilter;
    } else {
      return generateMipmaps
        ? THREE.LinearMipMapLinearFilter
        : THREE.LinearFilter;
    }
  }
  if (texture.userData.shaderParamsSet) {
    return;
  }
  texture.userData = { 'shaderParamsSet': true }
  texture.generateMipmaps = generateMipmaps;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.flipY = flipY;
  texture.minFilter = getMinFilter(true, generateMipmaps);
} 