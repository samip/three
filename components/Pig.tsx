/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/


import React, { useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei/native'
import { GLTF } from 'three-stdlib'
import { Asset } from 'expo-asset';
import { useThree } from '@react-three/fiber';
import { THREE } from 'expo-three';
type GLTFResult = GLTF & {
  nodes: {
    Pig_1: THREE.SkinnedMesh
    Pig_2: THREE.SkinnedMesh
    root: THREE.Bone
  }
  materials: {
    ['Material.003']: THREE.MeshStandardMaterial
    Material: THREE.MeshStandardMaterial
  }
}

export function getPigMesh() {
  const asset = Asset.fromModule(require('../assets/models/Pig.glb'));
  const { nodes, materials, animations } = useGLTF(asset.uri) as GLTFResult;
  const mesh = new THREE.SkinnedMesh(nodes.Pig_1.geometry, materials['Material.003']);

  mesh.skeleton = nodes.Pig_1.skeleton;
  return mesh;
}

// type GLTFActions = Record<ActionName, THREE.AnimationAction>

export default function Model() {
  const group = useRef<THREE.Group>()
  const asset = Asset.fromModule(require('../assets/models/Pig.glb'));
  const { nodes, materials, animations } = useGLTF(asset.uri) as GLTFResult;
  const { scene, camera } = useThree();

  scene.add(getPigMesh());
  
  // const { actions } = useAnimations<GLTFActions>(animations, group)
  return (
    <group ref={group} dispose={null}>
      <group name="Root_Scene">
        <group name="RootNode">
          <group name="Armature" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
            <primitive object={nodes.root} />
          </group>
          <group name="Pig" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
          </group>
        </group>
      </group>
    </group>
  )
}
