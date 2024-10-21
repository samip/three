import { StyleSheet, View, Text } from 'react-native';
import { Canvas } from '@react-three/fiber';
import Matrix from '@/components/Matrix';
import Box from '@/components/Box';


export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Matrix />
    </View>
    )
  }