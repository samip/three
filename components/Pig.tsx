import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei/native'
import { GLTF } from 'three-stdlib'
import { Asset } from 'expo-asset';
import { Renderer, THREE } from 'expo-three';
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react';
import { Scene } from 'three';


type GLTFResult = GLTF & {
  nodes: {
    Pig_1: THREE.SkinnedMesh
  }
  materials: {
    ['Material.003']: THREE.MeshStandardMaterial
    Material: THREE.MeshStandardMaterial
  }
}


export function getPigMesh() {
  const asset = Asset.fromModule(require('../assets/models/Pig.glb'));
  const { nodes, materials } = useGLTF(asset.uri) as GLTFResult;
  const material = materials['Material.003'];
  let mesh = new THREE.Mesh(nodes.Pig_1.geometry, material);
  const box = new THREE.BoxGeometry(10, 10, 10);
  // mesh = new THREE.Mesh(box, new THREE.MeshStandardMaterial({color: 0x00ff00}));
  mesh.name = 'pig';
  mesh.userData = {
    slug: 'pig',
    material: material,
  }
  return mesh;
}

export default function Model() {
  const { camera, gl, scene }  = useThree();
  let mesh = getPigMesh();
  
  mesh.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
    // console.log(renderer, scene, camera, geometry, material, group);
  }
  
  mesh.rotation.set(-Math.PI / 2, 0, 0);
  mesh.scale.set(100, 100, 100);
  

  const sampleCodeUniformTransforms = (uniforms: any, mesh: THREE.Mesh) => {
    uniforms.u_worldMatrix.value = mesh.matrixWorld;
    const viewProjMat = new THREE.Matrix4();
    const normalMat = new THREE.Matrix3();
    const worldViewPos = new THREE.Vector3();
    console.log(camera.position, mesh.scale, mesh.rotation);
    uniforms.u_viewProjectionMatrix.value = viewProjMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

    if (uniforms.u_viewPosition)
      uniforms.u_viewPosition.value = camera.getWorldPosition(worldViewPos);

    if (uniforms.u_worldInverseTransposeMatrix) {
      const worldInverseMat = new THREE.Matrix4().setFromMatrix3(normalMat.getNormalMatrix(mesh.matrixWorld));
      uniforms.u_worldInverseTransposeMatrix.value = worldInverseMat;
    }
    return uniforms;
  }

  async function setMaterial(mesh: THREE.Mesh) {
    fetch('/assets/materials/carpaint.jsmat')
      .then(response => response.json())
      .then(data => {
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
        }
        const material = new THREE.RawShaderMaterial(emptyShader);
        console.log(material);
        // material.uniforms = uniforms;
        // mesh.material = material;
        scene.add(mesh);
        
        gl.render(scene, camera);
      });
  }

  async function getFancyPigMesh() {
    await setMaterial(mesh);
    return mesh;
  }

  useEffect(() => {
    const asyncFunc = async () => {
      mesh = await getFancyPigMesh();
    }
    setTimeout(asyncFunc, 1000);
  }, []);

  return (
    <primitive object={mesh} />
  )
}
