import { getMaterialXTexture, updateDynamicUniforms } from '@/lib/MaterialX';
import { useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { MutableRefObject, useEffect, useRef } from 'react';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

export default function Scene({
  onControlsChange,
  mesh,
}: {
  onControlsChange: (e: any) => void;
  mesh?: THREE.Mesh;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { camera, gl, scene } = useThree();
  camera.position.set(0, 0, 100);

  const lightData = [
    { position: [0, 0, 100], intensity: 1, castShadow: true, direction: [0, 0, 0] },
  ];

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
      return;
      const bgTexture = new THREE.DataTexture(
        texture.image.data,
        texture.image.width,
        texture.image.height,
        THREE.RGBAFormat,
        texture.type,
      ).copy(texture);
      bgTexture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = bgTexture;
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
      // return;
      if (mesh) {
        const material = getMaterialXTexture(radianceTexture, irradianceTexture, lightData);
        mesh.material = material;
        updateDynamicUniforms(mesh, camera);
        scene.add(mesh);
        camera.position.set(0, 0, 100);
        gl.render(scene, camera);
      }
    };

    if (!radianceTextureRef.current || !irradianceTextureRef.current) {
      loadEnvTextures();
    }
  }, [gl.capabilities, scene]);

  const prepareEnvTexture = (texture: THREE.Texture, capabilities: THREE.WebGLCapabilities) => {
    let newTexture = new THREE.DataTexture(
      texture.image.data,
      texture.image.width,
      texture.image.height,
      THREE.RGBAFormat,
      texture.type,
    );
    newTexture.wrapS = THREE.RepeatWrapping;
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
