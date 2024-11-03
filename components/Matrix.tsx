import React, { useRef, useEffect, useMemo, useState } from "react";
import { useFrame, MeshProps } from "@react-three/fiber";
import { Stats, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface MatrixProps {
  xSize: number;
  ySize: number;
  padding: number;
  children?:THREE.Mesh;
  renderHelpers?: boolean;
}

export default function Matrix({children, xSize, ySize, padding = 0, renderHelpers = false}: MatrixProps) {
  const { scene } = useThree();
  const [colorMap, alphaMap] = useTexture([
    '/assets/textures/bricks.jpg',
    '/assets/textures/netmesh.png'
  ]);

  const itemSideLength = 1;

  const getBoxMesh = () => {
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(boxGeometry, boxMaterial);
  }

  const getDefaultMesh = () => getBoxMesh();
  const [mesh, setMesh] = useState<THREE.Mesh>(getDefaultMesh());

  const drawSphere = (position: THREE.Vector3, radius: number) => {
    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.copy(position);
    scene.add(sphereMesh);
  }

  const onChildBeforeRender = (mesh: THREE.Mesh, x: number, y: number) => {
  
  }

  const onChildLoad = (mesh: THREE.Mesh, x: number, y: number) => {
  
  }
  
  useEffect(() => {
    if (children) {
      const material = new THREE.MeshBasicMaterial();
      material.transparent = true

      material.alphaMap = alphaMap;
      mesh.material = material;
      children && (children.material = material);
      setMesh(children);
    }
  }, [children]);
  
  useFrame(() => {

  });



  
  // scale mesh to fit in 1x1x1 cube
  const scaleToFit = (mesh: THREE.Mesh) => {
    if (!mesh.geometry.boundingBox) {
      mesh.geometry.computeBoundingBox();
    }

    if (!mesh.geometry.boundingBox) {
      console.error('Could not compute bounding box');
      return;
    }

    const boundingBox = mesh.geometry.boundingBox;
    const max = Math.max(boundingBox.max.x - boundingBox.min.x, boundingBox.max.y - boundingBox.min.y, boundingBox.max.z - boundingBox.min.z);
    const padding = 0.2;
    const scale = (itemSideLength - padding)/ max;
    mesh.scale.set(scale, scale, scale);
  }

  const boxes = useMemo(() => {
    const boxArray: THREE.Mesh[][] = [];
    
    for (let x = 0; x < xSize; x++) {
      boxArray[x] = new Array(ySize);
      for (let y = 0; y < ySize; y++) {
        scaleToFit(mesh);

        // matrixMesh.material = material;
        mesh.onBeforeRender = () => {
          onChildBeforeRender(mesh, x, y);
        }
        boxArray[x].push(mesh.clone());
        onChildLoad(mesh, x, y);
      }}
    return boxArray;
  }, [xSize, ySize]);

  return (
    <React.Fragment>
      {renderHelpers && <axesHelper args={[8]} />}
      {renderHelpers && <gridHelper 
        position={[3.5, 3.5, 0]} 
        rotation={[Math.PI / 2, 0, 0]} 
        args={[xSize, xSize, 0xff0000, 'teal']} 
        />} 
      {boxes.map((row, x) => 
        row.map((mesh, y) => (
          <primitive 
            key={`${x}-${y}`}
            object={mesh}
            position={[x, y, 0]}
          />
        ))
      )}
    </React.Fragment>
  );
}
