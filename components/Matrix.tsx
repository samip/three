import React, { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree, MeshProps } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import * as THREE from "three";

interface MatrixProps {
  xSize: number;
  ySize: number;
  children?:THREE.Mesh;
}

export default function Matrix({children, xSize, ySize}: MatrixProps) {
  const controlsRef = useRef<any>(null);
  const { scene, camera, gl } = useThree();
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
    const scale = itemSideLength / max;
    mesh.scale.set(scale, scale, scale);
  }

  const centerPoint = useMemo(() => {
    const halfSide = itemSideLength / 2;
    return new THREE.Vector3((xSize / 2) - halfSide, (ySize / 2) - halfSide, 0);
  }, [xSize, ySize]);

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
    camera.position.set(centerPoint.x, centerPoint.y, 12);
    // camera.rotation.set(0.18, -0.25, 0.04);
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    drawSphere(centerPoint, 0.25);
  }, []);

  useFrame(() => {
  });

  const handleCameraMove = () => {
    // Actions to perform whenever the camera moves
    // console.log('Camera position:', controlsRef.current.object.position);
  };

  const handleCameraMoveEnd = () => {
    // Actions to perform when the camera stops moving
    // console.log('Camera move ended');
  };

  return (
    <React.Fragment>
      <ambientLight />
      <axesHelper args={[8]} />
      <OrbitControls
        ref={controlsRef}
        onChange={handleCameraMove}     // Triggers during camera movement
        onEnd={handleCameraMoveEnd}     // Triggers when movement ends
      />
      
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
