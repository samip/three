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
  }

  const onChildLoad = (mesh: THREE.Mesh, x: number, y: number) => {
    console.log('onChildLoad', mesh, x, y);
    if (x == 0 && y == 0) {
      mesh.position.set(x, y, -0.5)
    }
    if (x == xSize - 1 && y == ySize - 1) {
      mesh.position.set(x, y, 0.5)
    }
  }


  const getBoxMesh = () => {
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(boxGeometry, boxMaterial);
  }

  const getDefaultMesh = () => getBoxMesh();

  // Create memoized array of boxes
  const boxes = useMemo(() => {
    const boxArray: THREE.Mesh[][] = []; // array of arrays of Mesh3D
    for (let x = 0; x < xSize; x++) {
      boxArray[x] = [];
      for (let y = 0; y < ySize; y++) {

        const matrixMesh = children ? children.clone() : getDefaultMesh();
        matrixMesh.position.set(x, y, 0);
        matrixMesh.onBeforeRender = () => {
          onChildBeforeRender(matrixMesh, x, y);
        }
        boxArray[x].push(matrixMesh);
        scene.add(matrixMesh);
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

    camera.position.set(centerX, centerY, distance);
    camera.lookAt(centerX, centerY, 0);
  }, []);

  useFrame(() => {
  });

  return (
    <React.Fragment>
      <ambientLight />
      <OrbitControls />
      <gridHelper rotation={[Math.PI / 2, 0, 0]} args={[20, 20, 0xff0000, 'teal']} />
    </React.Fragment>
  );
}
