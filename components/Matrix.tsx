import React, { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree, MeshProps } from "@react-three/fiber";
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
  const { scene, camera } = useThree();
  

  const onChildBeforeRender = (mesh: THREE.Mesh, x: number, y: number) => {
    // console.log('onChildBeforeRender', x, y);
  }

  const onChildLoad = (mesh: THREE.Mesh, x: number, y: number) => {
    console.log('onChildLoad', x, y);
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
    let subscription: any;

    if (Platform.OS !== "web") {
      Gyroscope.setUpdateInterval(20); // Update interval in milliseconds
      Gyroscope.isAvailableAsync().then((available) => {
        if (available) {
          subscription = Gyroscope.addListener((data) => {
            rotation.current.x = data.x ?? 0;
            rotation.current.y = data.y ?? 0;
            rotation.current.z = data.z ?? 0;
          });
        }
      });
    }

    camera.position.set(3.5, 3, 6);

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += rotation.current.x;
      ref.current.rotation.y += rotation.current.y;
      ref.current.rotation.z += rotation.current.z;
    }
  });

  return (
    <React.Fragment>
      <ambientLight />
    </React.Fragment>
  );
}
