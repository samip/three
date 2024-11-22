import { useGLTF } from '@react-three/drei/native';
import { useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { useEffect, useRef } from 'react';
import { GLTF } from 'three-stdlib';

export default function Pig() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { camera, gl, scene } = useThree();
  const asset = Asset.fromModule(require('../assets/models/Pig.glb'));
  const { nodes, materials } = useGLTF(asset.uri) as GLTFResult;

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

    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.scale.set(100, 100, 100);
    return mesh;
  };

  const meshRef = useRef<THREE.Mesh>(getPigMesh());

  async function setMaterial(mesh: THREE.Mesh) {
    fetch('/assets/materials/carpaint.jsmat')
      .then((response) => response.json())
      .then((data) => {
        // const uniforms = sampleCodeUniformTransforms(data.uniforms, mesh);
        //data.uniforms = uniforms;
        const emptyShader = {
          glslVersion: THREE.GLSL3,
          vertexShader: `
            layout(location = 0) in vec4 in_position;
            void main()
            {
                gl_Position = in_position;
            }
          `,
          fragmentShader: `
            precision mediump float;
            uniform sampler2D tex;
            uniform vec2 tex_size;

            layout(location = 0) out vec4 out_color;

            void main()
            {
                vec4 in_color = texture(tex, gl_FragCoord.xy / tex_size);
                out_color = in_color;
            }
          `,
          transparent: false,
          blending: THREE.NoBlending,
          side: THREE.DoubleSide,
        };

        const material = new THREE.RawShaderMaterial(emptyShader);
        meshRef.current.material = material;
      });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function getFancyPigMesh() {
    await setMaterial(meshRef.current);
  }

  useEffect(() => {
    const asyncFunc = async () => {
      // await getFancyPigMesh();
    };
    setTimeout(asyncFunc, 1000);
  }, []);

  // <mesh ref={meshRef} /> didnt work
  // eslint-disable-next-line react/no-unknown-property
  return <primitive object={meshRef.current} />;
}
