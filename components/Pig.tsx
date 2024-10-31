import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei/native'
import { GLTF } from 'three-stdlib'
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';

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
  const mesh = new THREE.Mesh(nodes.Pig_1.geometry, material);
  return mesh;
}

export default function Model() {
  const group = useRef<THREE.Group>(null)
  
  return (
    <group ref={group} dispose={null}>
      <group name="Root_Scene">
        <group name="RootNode">
          <group name="Pig" rotation={[-Math.PI / 2, 0, 0]} scale={100}>
            <primitive object={getPigMesh()} />
          </group>
        </group>
      </group>
    </group>
  )
}
