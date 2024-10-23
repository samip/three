import { StyleSheet, View, Text } from 'react-native';
import {  Canvas } from "@react-three/fiber";
import Matrix from '@/components/Matrix';


export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Canvas  style={{ flex: 1, backgroundColor: '#3b3b3b' }}>
        <Matrix />
      </Canvas>
    </View>
    )
  }