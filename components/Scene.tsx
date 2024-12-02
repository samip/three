import { getMaterialXTexture, updateDynamicUniforms } from '@/lib/MaterialX';
import { OrbitControls } from '@/lib/vendor/OrbitControls';
import { RGBELoader } from '@/lib/vendor/RGBELoader';
import { useFrame, useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

export default function Scene({ mesh }: { mesh?: THREE.Mesh }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { camera, gl, scene } = useThree();
  const renderNeeded = useRef(true);
  const [lightData] = useState([
    { position: [0, 0, 100], intensity: 1, castShadow: true, direction: [0, 0, 0] },
  ]);

  const radianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;

  const irradianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  );
  scene.add(cube);

  // Initial setup effect - runs once on mount
  useEffect(() => {
    const setBackgroundTexture = (texture: THREE.Texture) => {
      const bgTexture = new THREE.DataTexture(
        texture.image.data,
        texture.image.width,
        texture.image.height,
        THREE.RGBAFormat,
        texture.type,
      ).copy(texture);
      bgTexture.mapping = THREE.EquirectangularReflectionMapping;
      backgroundTextureRef.current = bgTexture;
      scene.background = backgroundTextureRef.current;
    };

    const loadEnvTextures = async () => {
      const hdrLoader = new RGBELoader();
      const capabilities = gl.capabilities;

      const assetRadiance = Asset.fromModule(
        require('../assets/lights/san_giuseppe_bridge_split.hdr'),
      );
      const assetIrradiance = Asset.fromModule(
        require('../assets/lights/irradiance/san_giuseppe_bridge_split.hdr'),
      );
      const radianceTexture = await hdrLoader.loadAsync(assetRadiance.uri);
      const irradianceTexture = await hdrLoader.loadAsync(assetIrradiance.uri);

      const processedRadiance = prepareEnvTexture(radianceTexture, capabilities);
      const processedIrradiance = prepareEnvTexture(irradianceTexture, capabilities);
      radianceTextureRef.current = processedRadiance;
      irradianceTextureRef.current = processedIrradiance;
      setBackgroundTexture(radianceTexture);
      renderNeeded.current = true;
      if (mesh) {
        const material = getMaterialXTexture(radianceTexture, irradianceTexture, lightData);
        mesh.material = material;
        camera.position.set(100, 0, 0);
        // needs to be called after camera position is set
        orbitControlsRef.current.update();
        updateDynamicUniforms(mesh, camera);
        scene.add(mesh);
        renderNeeded.current = true;
      }
    };

    if (!radianceTextureRef.current || !irradianceTextureRef.current) {
      loadEnvTextures();
    }
  }, [gl.capabilities, scene, camera, mesh, lightData]);

  const prepareEnvTexture = (texture: THREE.Texture, _capabilities: THREE.WebGLCapabilities) => {
    let newTexture = new THREE.DataTexture(
      texture.image.data,
      texture.image.width,
      texture.image.height,
      THREE.RGBAFormat,
      texture.type,
    );
    newTexture.wrapS = THREE.RepeatWrapping;
    // TODO: figure out why this doesn't work on Android
    // newTexture.anisotropy = capabilities.getMaxAnisotropy();
    newTexture.minFilter = THREE.LinearMipmapLinearFilter;
    newTexture.magFilter = THREE.LinearFilter;
    newTexture.generateMipmaps = true;
    newTexture.needsUpdate = true;
    newTexture.flipY = false;

    return newTexture;
  };
  return <></>;
}
