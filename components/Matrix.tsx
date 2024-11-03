import React, { useRef, useEffect, useMemo } from "react";
import { useFrame, MeshProps } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
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
  const itemSideLength = 1;

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

  useFrame(() => {

  });


  const getBoxMesh = () => {
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(boxGeometry, boxMaterial);
  }

  const getDefaultMesh = () => getBoxMesh();
  
  // scale mesh to fit in 1x1x1 cube
  const scaleToFit = (mesh: THREE.Mesh) => {
    let boundingBox = mesh.geometry.boundingBox; // object.geometry.computeBoundingBox();
    if (!boundingBox) {
      mesh.geometry.computeBoundingBox();
    }
    boundingBox = mesh.geometry.boundingBox;
    if (!boundingBox) {
      console.error('Could not compute bounding box');
      return;
    }
    const max = Math.max(boundingBox.max.x - boundingBox.min.x, boundingBox.max.y - boundingBox.min.y, boundingBox.max.z - boundingBox.min.z);
    const padding = 0.2;
    const scale = (itemSideLength - padding)/ max;
    mesh.scale.set(scale, scale, scale);
  }

  const boxes = useMemo(() => {
    const boxArray: THREE.Mesh[][] = [];
    for (let x = 0; x < xSize; x++) {
      boxArray[x] = [];
      for (let y = 0; y < ySize; y++) {
        const matrixMesh = children ? children.clone() : getDefaultMesh();
        scaleToFit(matrixMesh);
        matrixMesh.onBeforeRender = () => {
          onChildBeforeRender(matrixMesh, x, y);
        }
        boxArray[x].push(matrixMesh);
        onChildLoad(matrixMesh, x, y);
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
