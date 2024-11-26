import { useGLTF, useTexture } from '@react-three/drei/native';
import { useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { useEffect, useRef } from 'react';
import { GLTF } from 'three-stdlib';

export default function Pig() {
  const { camera, gl, scene } = useThree();
  camera.position.set(camera.position.x, camera.position.y + 10, camera.position.z);
  const asset = Asset.fromModule(require('../assets/models/Pig.glb'));
  const { nodes, materials } = useGLTF(asset.uri) as GLTFResult;

  const viewProjMatRef = useRef(new THREE.Matrix4());
  const worldViewPosRef = useRef(new THREE.Vector3());
  const normalMatRef = useRef(new THREE.Matrix3());
  const [colorMap, _bricksMap] = useTexture(['/assets/textures/netmesh.png', '/assets/textures/bricks.jpg']);

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

  const getPigMesh = () => {
    const material = materials.Material;
    const mesh = new THREE.Mesh(nodes.Pig_1.geometry, material);
    mesh.name = 'pig';
    mesh.userData = {
      slug: 'pig',
    };
    console.log('Mesh position', mesh.position);
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
      const bsphere = mesh.geometry.boundingSphere;
      if (bsphere) {
        for (let i = 0; i < posCount; i++) {
          uvs.push((pos[i * 3] - bsphere.center.x) / bsphere.radius);
          uvs.push((pos[i * 3 + 1] - bsphere.center.y) / bsphere.radius);
        }
      }

      mesh.geometry.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(uvs), 2),
      );
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
    mesh.geometry.attributes.i_position = mesh.geometry.attributes.position;
    mesh.geometry.attributes.i_normal = mesh.geometry.attributes.normal;
    mesh.geometry.attributes.i_tangent = mesh.geometry.attributes.tangent;
    mesh.geometry.attributes.i_texcoord_0 = mesh.geometry.attributes.uv;
    console.log('Mesh geometry attributes:', mesh.geometry.attributes);
  }
  function setTextureParameters(
    texture: THREE.Texture,
    flipY = true,
    generateMipmaps = true,
  ) {
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

    texture.generateMipmaps = generateMipmaps;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = flipY;
    texture.minFilter = getMinFilter(true, generateMipmaps);
  } 

  async function setMaterial(mesh: THREE.Mesh) {
    const emptyShader = {
      glslVersion: THREE.GLSL3,
      uniforms: {
        modelMatrix: { value: mesh.matrixWorld },
        viewMatrix: { value: camera.matrixWorldInverse },
        projectionMatrix: { value: camera.projectionMatrix },
        normalMatrix: { value: normalMatRef.current.getNormalMatrix(mesh.matrixWorld) },
        tex: { value: _bricksMap },
        tex_size: { value: new THREE.Vector2(_bricksMap.image.width, _bricksMap.image.height) },
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
    console.log('Mesh material:', mesh.material);
    // updateTransforms(mesh);
    return mesh;
  }

  function updateTransforms(child: THREE.Mesh) {
    if (!child) return;

    const material = child.material as THREE.RawShaderMaterial;
    const uniforms = material.uniforms;

    if (!uniforms) {
      return;
    }

    // Update matrices
    uniforms.modelMatrix.value.copy(child.matrixWorld);
    uniforms.viewMatrix.value.copy(camera.matrixWorldInverse);
    uniforms.projectionMatrix.value.copy(camera.projectionMatrix);
    uniforms.normalMatrix.value.getNormalMatrix(child.matrixWorld);
  }


  useEffect(() => {
    const asyncFunc = async () => {
      meshRef.current = await getFancyPigMesh();
      scene.add(meshRef.current);
      gl.render(scene, camera);
    };
    setTimeout(asyncFunc, 1000);
  }, []);

  // <mesh ref={meshRef} /> didnt work
  // eslint-disable-next-line react/no-unknown-property
  return meshRef.current && <primitive object={meshRef.current} />;
}
