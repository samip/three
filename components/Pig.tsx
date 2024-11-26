import { useGLTF, useTexture } from '@react-three/drei/native';
import { useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { useEffect, useRef } from 'react';
import { GLTF } from 'three-stdlib';

export default function Pig({ onControlsChange }: { onControlsChange: (e: any) => void }) {
  const { camera, gl, scene } = useThree();
  camera.position.set(camera.position.x, 10, camera.position.z);
  const asset = Asset.fromModule(require('../assets/models/Pig.glb'));
  const { nodes, materials } = useGLTF(asset.uri) as GLTFResult;

  const normalMatRef = useRef(new THREE.Matrix3());
  const [_colorMap, bricksMap] = useTexture(['/assets/textures/netmesh.png', '/assets/textures/bricks.jpg']);

  type GLTFResult = GLTF & {
    nodes: {
      Pig_0: THREE.SkinnedMesh;
      Pig_1: THREE.Mesh;
    };
    materials: {
      ['Material.002']: THREE.MeshStandardMaterial;
      Material: THREE.MeshStandardMaterial;
    };
  };

  const controlsChanged = (e: any) => {
    const camera = e.target.object;

    if (!meshRef.current) {
      return;
    }

    const mesh = meshRef.current;
    if (!(mesh.material instanceof THREE.ShaderMaterial)) {
      return;
    }
    const material = (mesh.material as THREE.ShaderMaterial);;
    // Update matrices in uniforms
    material.uniforms.viewMatrix.value.copy(camera.matrixWorldInverse);
    material.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);
    
    // Update normal matrix
    const normalMatrix = new THREE.Matrix3();
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    material.uniforms.normalMatrix.value.copy(normalMatrix);
  };

  onControlsChange((e: any) => { controlsChanged(e) });

  const getPigMesh = () => {
    const material = materials.Material;
    const mesh = new THREE.Mesh(nodes.Pig_1.geometry, material);
    mesh.name = 'pig';
    mesh.userData = {
      slug: 'pig',
    };
    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.scale.set(100, 100, 100);
    return mesh;
  };

  async function getFancyPigMesh() {
    const mesh = getPigMesh();
    calculateMissingGeometry(mesh);
    await setMaterial(mesh);
    return mesh;
  }

  const meshRef = useRef<THREE.Mesh | null>(getPigMesh());

  function calculateMissingGeometry(mesh: THREE.Mesh) {
    const flipV = true;
    if (!mesh.geometry.attributes.uv) {
      const posCount = mesh.geometry.attributes.position.count;
      const uvs = [];
      const pos = mesh.geometry.attributes.position.array;
      if (!mesh.geometry.boundingSphere) {
        mesh.geometry.computeBoundingSphere();
      }
      // doesn't make sense, copied from other project
      const bsphere = mesh.geometry.boundingSphere;
      if (bsphere) {
        for (let i = 0; i < posCount; i++) {
          uvs.push((pos[i * 3] - bsphere.center.x) / bsphere.radius);
          uvs.push((pos[i * 3 + 1] - bsphere.center.y) / bsphere.radius);
        }
        mesh.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
      }
    } else if (flipV) {
      const uvCount = mesh.geometry.attributes.position.count;
      const uvs = mesh.geometry.attributes.uv.array;
      for (let i = 0; i < uvCount; i++) {
        let v = 1.0 - uvs[i * 2 + 1];
        uvs[i * 2 + 1] = v;
      }
    }

    if (!mesh.geometry.attributes.normal) {
      mesh.geometry.computeVertexNormals();
    }

    if (mesh.geometry.getIndex()) {
      if (!mesh.geometry.attributes.tangent) {
        mesh.geometry.computeTangents();
      }
    }
    // Use default MaterialX naming convention.
    // TODO: figure out what these are for (MaterialX?)
    // mesh.geometry.attributes.i_position = mesh.geometry.attributes.position;
    // mesh.geometry.attributes.i_normal = mesh.geometry.attributes.normal;
    // mesh.geometry.attributes.i_tangent = mesh.geometry.attributes.tangent;
    // mesh.geometry.attributes.i_texcoord_0 = mesh.geometry.attributes.uv;
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

  // TODO: compare with https://github.com/AcademySoftwareFoundation/MaterialX/blob/main/javascript/MaterialXView/source/viewer.js#L252
  // TODO: figure out why uniforms dont change after camera moves
  function getDynamicUniforms(mesh: THREE.Mesh, camera: THREE.Camera) {
    const uniforms = {
      modelMatrix: new THREE.Uniform(mesh.matrixWorld),
      viewMatrix: new THREE.Uniform(camera.matrixWorldInverse),
      projectionMatrix: new THREE.Uniform(camera.projectionMatrix),
      normalMatrix: new THREE.Uniform(normalMatRef.current.getNormalMatrix(mesh.matrixWorld)),
    };
    
    return uniforms;
  }

  async function setMaterial(mesh: THREE.Mesh) {
    const tex = bricksMap;
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
    console.log('Mesh materia set:', mesh.material);
    return mesh;
  }

  function updateDynamicUniforms(mesh: THREE.Mesh, camera: THREE.Camera) {
    if (!(mesh?.material instanceof THREE.ShaderMaterial)) {
      return;
    }
    const material = mesh.material;
    material.uniforms.modelMatrix.value.copy(mesh.matrixWorld);
    material.uniforms.viewMatrix.value.copy(camera.matrixWorldInverse);
    material.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);
    
    // Update normal matrix
    const normalMatrix = new THREE.Matrix3();
    normalMatrix.getNormalMatrix(mesh.matrixWorld);
    material.uniforms.normalMatrix.value.copy(normalMatrix);
  }

  useEffect(() => {
    const asyncFunc = async () => {
      meshRef.current = await getFancyPigMesh();
      scene.add(meshRef.current);
      gl.render(scene, camera);
    };
    setTimeout(asyncFunc, 1000);
  });

  return meshRef.current && <primitive object={meshRef.current} />;
}
