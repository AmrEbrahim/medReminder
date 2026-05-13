import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { scanPrescription } from '../../services/visionService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { ScannedPrescription } from '../../types';

type Step = 'capture' | 'processing' | 'review';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanned, setScanned] = useState<ScannedPrescription | null>(null);
  const cameraRef = useRef<CameraView>(null);

  async function takePicture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) {
      setImageUri(photo.uri);
      await processImage(photo.uri);
    }
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await processImage(uri);
    }
  }

  async function processImage(uri: string) {
    setStep('processing');
    try {
      const result = await scanPrescription(uri);
      setScanned(result);
      setStep('review');
    } catch (err) {
      console.error('[scan] Gemini scan failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert(
        'Scan Failed',
        message,
        [{ text: 'Try Again', onPress: () => setStep('capture') }]
      );
    }
  }

  function handleConfirm() {
    if (!scanned) return;
    router.replace({
      pathname: '/medications/add',
      params: {
        prefill_name: scanned.medicationName ?? '',
        prefill_dosage: scanned.dosage ?? '',
        prefill_unit: scanned.unit ?? '',
        prefill_instructions: scanned.instructions ?? '',
        prefill_prescribedBy: scanned.prescribedBy ?? '',
        prefill_pharmacy: scanned.pharmacy ?? '',
        prefill_rxNumber: scanned.rxNumber ?? '',
      },
    });
  }

  if (!permission) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionScreen}>
          <Ionicons name="camera-outline" size={64} color={Colors.primary} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDesc}>
            medReminder needs camera access to scan prescription labels.
          </Text>
          <Button label="Grant Camera Access" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.processingScreen}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          )}
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Reading prescription with AI...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'review' && scanned) {
    const confidence = scanned.confidence ?? 0;
    const confidenceColor = confidence >= 0.7 ? Colors.secondary : confidence >= 0.4 ? Colors.warning : Colors.error;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.reviewContent}>
          <Text style={styles.reviewTitle}>Prescription Scanned</Text>

          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.reviewImage} resizeMode="cover" />
          )}

          <View style={[styles.confidenceBanner, { backgroundColor: confidenceColor + '20' }]}>
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              Confidence: {Math.round(confidence * 100)}%
              {confidence < 0.5 ? ' — Please verify all fields manually' : ''}
            </Text>
          </View>

          <Card style={styles.resultsCard}>
            {[
              { label: 'Medication Name', value: scanned.medicationName },
              { label: 'Generic Name', value: scanned.genericName },
              { label: 'Dosage', value: scanned.dosage ? `${scanned.dosage} ${scanned.unit ?? ''}` : undefined },
              { label: 'Instructions', value: scanned.instructions },
              { label: 'Prescribed By', value: scanned.prescribedBy },
              { label: 'Pharmacy', value: scanned.pharmacy },
              { label: 'Rx Number', value: scanned.rxNumber },
              { label: 'Quantity', value: scanned.quantity },
              { label: 'Refills', value: scanned.refills },
            ].map(({ label, value }) =>
              value ? (
                <View key={label} style={styles.resultRow}>
                  <Text style={styles.resultLabel}>{label}</Text>
                  <Text style={styles.resultValue}>{value}</Text>
                </View>
              ) : null
            )}
          </Card>

          <View style={styles.reviewActions}>
            <Button
              label="Use These Details"
              onPress={handleConfirm}
              size="lg"
              style={{ flex: 1 }}
            />
            <Button
              label="Scan Again"
              onPress={() => { setStep('capture'); setImageUri(null); setScanned(null); }}
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Capture step
  return (
    <SafeAreaView style={styles.safe}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Viewfinder overlay */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.viewfinderHint}>
            Position the prescription label inside the frame
          </Text>
        </View>

        {/* Bottom actions */}
        <View style={styles.cameraActions}>
          <TouchableOpacity style={styles.libraryBtn} onPress={pickFromLibrary}>
           <Ionicons name="image-outline" size={32} color="gray" />
            {/* <Text style={styles.libraryBtnText}>📁{'\n'}Library</Text> */}
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <View style={{ width: 64 }} />
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  viewfinderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  viewfinder: { width: 300, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  viewfinderHint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', maxWidth: 260 },

  cameraActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 40, paddingHorizontal: 32 },
  libraryBtn: { width: 64, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  libraryBtnText: { color: '#fff', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },

  permissionScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: Colors.background },

  permissionTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  permissionDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  processingScreen: { flex: 1, backgroundColor: '#000' },
  previewImage: { ...StyleSheet.absoluteFillObject },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 16 },
  processingText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },

  reviewContent: { padding: 16, gap: 16, paddingBottom: 40 },
  reviewTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  reviewImage: { width: '100%', height: 180, borderRadius: 12 },
  confidenceBanner: { borderRadius: 8, padding: 10 },
  confidenceText: { fontWeight: '600', fontSize: 13 },
  resultsCard: { gap: 8 },
  resultRow: { flexDirection: 'row', gap: 8 },
  resultLabel: { width: 130, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  resultValue: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  reviewActions: { flexDirection: 'row', gap: 12 },
});
