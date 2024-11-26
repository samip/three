import { useThree } from '@react-three/fiber';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AxesHelper, GridHelper } from 'three';
import { animateTexture } from './LiveTexture';

interface MatrixProps {
  xSize: number;
  ySize: number;
  padding: number;
  children?: THREE.Mesh;
  renderHelpers?: boolean;
}

export default function Matrix({
  children,
  xSize,
  ySize,
  padding = 0,
  renderHelpers = false,
}: MatrixProps) {
  const { scene } = useThree();
  if (renderHelpers) {
    const gridHelper = new GridHelper(
      Math.max(xSize, ySize),
      Math.max(xSize, ySize),
      0xff0000,
      'teal',
    );
    gridHelper.position.set(3.5, 3.5, 0);
    gridHelper.rotation.set(Math.PI / 2, 0, 0);
    scene.add(gridHelper);
    const axesHelper = new AxesHelper(xSize);
    scene.add(axesHelper);
  }

  /*
  const [colorMap, alphaMap, diagonal, diagonalRainbow] = useTexture([
    '/assets/textures/bricks.jpg',
    '/assets/textures/netmesh.png',
    '/assets/textures/diagonal.webp',
    '/assets/textures/diagonal_rainbow.webp'
  ]);
  */
  const itemSideLength = 1;

  const getBoxMesh = () => {
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMaterial = new THREE.MeshStandardMaterial();
    return new THREE.Mesh(boxGeometry, boxMaterial);
  };

  const defaultMesh = getBoxMesh();

  const onChildBeforeRender = (mesh: THREE.Mesh, _x: number, _y: number) => {
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
    }
  };

  const onChildLoad = (mesh: THREE.Mesh, x: number, y: number) => {
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.transparent = true;
      //mesh.material.alphaMap = alphaMap;
      //mesh.material.map = alphaMap;
      // mesh.material.map = colorMap;
      // mesh.material.map = diagonalRainbow;
      animateTexture(mesh);
      // mesh.material.alphaMap = generateLiveTexture(LiveTextureType.DIAGONAL, 1.0);
      // mesh.material.map = generateLiveTexture(LiveTextureType.DIAGONAL);
    }
    if (x === 0 && y === 0 && mesh.material instanceof THREE.MeshStandardMaterial) {
      // mesh.material.transparent = generateLiveTexture(LiveTextureType.DIAGONAL, 1.0);
    }
  };

  // scale mesh to fit in 1x1x1 cube
  const scaleToFit = (mesh: THREE.Mesh, padding: number) => {
    if (!mesh.geometry.boundingBox) {
      mesh.geometry.computeBoundingBox();
    }

    if (!mesh.geometry.boundingBox) {
      console.error('Could not compute bounding box');
      return;
    }

    const boundingBox = mesh.geometry.boundingBox;
    const max = Math.max(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z,
    );
    const scale = (itemSideLength - padding) / max;
    mesh.scale.set(scale, scale, scale);
  };

  const boxes = useMemo(() => {
    const boxArray: THREE.Mesh[][] = [];

    for (let x = 0; x < xSize; x++) {
      boxArray[x] = new Array(ySize);
      for (let y = 0; y < ySize; y++) {
        const newMesh = children ? children.clone() : defaultMesh;
        scaleToFit(newMesh, padding);
        newMesh.onBeforeRender = () => {
          onChildBeforeRender(newMesh, x, y);
        };
        newMesh.position.set(x, y, 0);
        boxArray[x].push(newMesh);
        onChildLoad(newMesh, x, y);
      }
    }
    return boxArray;
  }, [xSize, ySize, children, padding, defaultMesh]);

  return (
    <React.Fragment>
      {boxes.map((row, x) =>
        row.map((mesh, y) => (
          <primitive key={`${x}-${y}`} object={mesh} />
        )),
      )}
    </React.Fragment>
  );
}
