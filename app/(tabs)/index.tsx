import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Canvas } from '@react-three/fiber';
import Box from '../../components/Box'; // Adjust the path as necessary

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Canvas style={{ flex: 1, backgroundColor: 'red' }}>
        <ambientLight />
        <Box />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});