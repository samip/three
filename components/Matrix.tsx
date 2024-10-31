import React, { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree, MeshProps } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import * as THREE from "three";
import { Gyroscope } from "expo-sensors";
import { Platform } from "react-native";
import { Children } from 'react';
import Box from './Box';

interface MatrixProps {
  xSize: number;
  ySize: number;
  children?:THREE.Mesh;
}

export default function Matrix({children, xSize, ySize}: MatrixProps) {
  const ref = useRef<THREE.Mesh>(null!);
  const rotation = useRef({ x: 0, y: 0, z: 0 });
  const { scene, camera, gl } = useThree();

  const drawSphere = (position: THREE.Vector3, radius: number) => {
    const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.copy(position);
    scene.add(sphereMesh);
  }

  const onChildBeforeRender = (mesh: THREE.Mesh, x: number, y: number) => {
    // drawSphere(mesh.boundingSphere.center, mesh.boundingSphere.radius);
    // console.log('onChildBeforeRender', x, y);
    // mesh.scale.set(0.001, 0.001, 0.001);
    // mesh.geometry.scale(0.51, 0.51, 0.51);
  }

  const onChildLoad = (mesh: THREE.Mesh, x: number, y: number) => {

  }


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
    const scale = 1 / max;
    mesh.scale.set(scale, scale, scale);
  }
  // Create memoized array of boxes
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

  useEffect(() => {
    // camera.position.set(3.5, 3, 6);
    //controls.update();  //controls.update() must be called after any manual changes to the camera's transform
    // Position camera to view entire matrix
    const maxDimension = Math.max(xSize, ySize);
    const distance = maxDimension * 1.5; // Multiplier for margin
    const centerX = (xSize - 1) / 2;
    const centerY = (ySize - 1) / 2;
    const helper = new THREE.CameraHelper( camera );
    //scene.add( helper );
    camera.position.set(centerX, centerY, distance);
    camera.lookAt(centerX, centerY, 0);
  }, []);

  useFrame(() => {
  });

  return (
    <React.Fragment>
      <ambientLight />
      <OrbitControls />
      <gridHelper position={[3.5, 3.5, 0]} rotation={[Math.PI / 2, 0, 0]} args={[xSize, xSize, 0xff0000, 'teal']} />
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
