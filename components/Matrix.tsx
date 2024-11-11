import React, { useRef, useEffect, useMemo, useState } from "react";
import { useFrame, MeshProps } from "@react-three/fiber";
import { Stats, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateLiveTexture, LiveTextureType, getCanvas, dumpTexture, animateTexture } from "./LiveTexture";

interface MatrixProps {
  xSize: number;
  ySize: number;
  padding: number;
  children?: THREE.Mesh;
  renderHelpers?: boolean;
}

export default function Matrix({ children, xSize, ySize, padding = 0, renderHelpers = false }: MatrixProps) {
  const { scene } = useThree();
  const [colorMap, alphaMap, diagonal, diagonalRainbow] = useTexture([
    '/assets/textures/bricks.jpg',
    '/assets/textures/netmesh.png',
    '/assets/textures/diagonal.webp',
    '/assets/textures/diagonal_rainbow.webp'
  ]);

  const meshAnimations = new Map<number, any>();

  const [mesh, setMesh] = useState<THREE.Mesh>();

  const itemSideLength = 1;

  const getBoxMesh = () => {
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshStandardMaterial();
    return new THREE.Mesh(boxGeometry, boxMaterial);
  }

  const getDefaultMesh = () => getBoxMesh();

  const onChildBeforeRender = (mesh: THREE.Mesh, x: number, y: number) => {
    if (mesh.material instanceof THREE.MeshStandardMaterial) {

    }
  }


  const onChildLoad = (mesh: THREE.Mesh, x: number, y: number) => {
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.transparent = true;
      //mesh.material.alphaMap = alphaMap;
      //mesh.material.map = alphaMap;
      // mesh.material.map = colorMap;
      mesh.material.map = diagonalRainbow;
      animateTexture(mesh);
   
      // mesh.material.alphaMap = generateLiveTexture(LiveTextureType.DIAGONAL, 1.0);
      // mesh.material.map = generateLiveTexture(LiveTextureType.DIAGONAL);
    }
    if (x === 0 && y === 0 && mesh.material instanceof THREE.MeshStandardMaterial) {
      // mesh.material.transparent = generateLiveTexture(LiveTextureType.DIAGONAL, 1.0);
    }
  }

  useEffect(() => {
    if (children) {
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
    const scale = (itemSideLength - padding) / max;
    mesh.scale.set(scale, scale, scale);
  }

  const boxes = useMemo(() => {
    const boxArray: THREE.Mesh[][] = [];

    for (let x = 0; x < xSize; x++) {
      boxArray[x] = new Array(ySize);
      for (let y = 0; y < ySize; y++) {
        const newMesh = mesh ? mesh.clone() : getDefaultMesh();
        scaleToFit(newMesh);
        newMesh.onBeforeRender = () => {
          onChildBeforeRender(newMesh, x, y);
        }

        boxArray[x].push(newMesh);
        onChildLoad(newMesh, x, y);
      }
    }
    return boxArray;
  }, [xSize, ySize, mesh]);

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
