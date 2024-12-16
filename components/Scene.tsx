import { getMaterialXTexture, updateDynamicUniforms } from '@/lib/MaterialX';
import { OrbitControls } from '@/lib/vendor/OrbitControls';
import { RGBELoader } from '@/lib/vendor/RGBELoader';
import { useFrame, useThree } from '@react-three/fiber';
import { Asset } from 'expo-asset';
import { THREE } from 'expo-three';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

export default function Scene({ mesh }: { mesh?: THREE.Mesh }) {
  const { camera, gl, scene } = useThree();
  const renderNeeded = useRef(0);
  const [lightData] = useState([
    { position: [0, 0, 100], intensity: 1, castShadow: true, direction: [0, 0, 0] },
  ]);

  const radianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;

  const irradianceTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;

  const backgroundTextureRef = useRef<THREE.Texture | null>(
    null,
  ) as MutableRefObject<THREE.Texture | null>;

  // Initial setup effect - runs once on mount
  useEffect(() => {
    const orbitControls = new OrbitControls(camera, gl.domElement);
    const onChange = () => {
      if (mesh) {
        updateDynamicUniforms(mesh, camera);
        setRenderNeeded(true);
      }
    };

    orbitControls.autoRotate = false;
    orbitControls.target.set(0, 0, 0);
    orbitControls.addEventListener('change', onChange);
    setRenderNeeded(true);
    orbitControls.update();
    // Trigger initial renderk

    return () => {
      scene.clear();
      orbitControls.removeEventListener('change', onChange);
      orbitControls.dispose();
    };
  }, []); //eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for texture loading
  useEffect(() => {
    if (!radianceTextureRef.current || !irradianceTextureRef.current) {
      loadEnvTextures();
    }

    return () => {
      scene.clear();
    };
  }, [gl.capabilities, scene, camera, mesh, lightData]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(() => {
    if (renderNeeded.current) {
      gl.render(scene, camera);
      renderNeeded.current -= 1;
    }
  }, 1);

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
    if (mesh) {
      const material = getMaterialXTexture(
        radianceTextureRef.current,
        irradianceTextureRef.current,
        lightData,
      );
      mesh.material = material;
      camera.position.set(100, 0, 0);
      camera.lookAt(0, 0, 0);
      updateDynamicUniforms(mesh, camera);
      scene.add(mesh);
    }
    setRenderNeeded(true);
  };
  const setRenderNeeded = (needed: boolean = true) => {
    if (needed) {
      renderNeeded.current = 10;
    } else {
      renderNeeded.current = 0;
    }
  };

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

  const prepareEnvTexture = (texture: THREE.Texture, capabilities: THREE.WebGLCapabilities) => {
    let newTexture = new THREE.DataTexture(
      texture.image.data,
      texture.image.width,
      texture.image.height,
      THREE.RGBAFormat,
      texture.type,
    );
    newTexture.wrapS = THREE.RepeatWrapping;
    // TODO: figure out why this doesn't work on Android
    newTexture.anisotropy = capabilities.getMaxAnisotropy();
    newTexture.minFilter = THREE.LinearMipmapLinearFilter;
    newTexture.magFilter = THREE.LinearFilter;
    newTexture.generateMipmaps = false;
    newTexture.needsUpdate = true;
    newTexture.flipY = false;

    return newTexture;
  };
  return <></>;
}
