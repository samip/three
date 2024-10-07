import { StyleSheet, View, Text } from 'react-native';
import { Canvas } from '@react-three/fiber';
import Box from '../components/Box'; // Adjust the path as necessary

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Canvas style={{ flex: 1, backgroundColor: 'red' }}>
        <ambientLight />
        {[0, 1, 2].map((x) => (
          <Box key={x} position={[x, 0, 0]} />
        ))}
      </Canvas>
    </View>
    )
  }