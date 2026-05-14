import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { BrutalCard } from '../components/BrutalCard';
import { BrutalButton } from '../components/BrutalButton';
import { simulateOcr, OcrResult } from '../services/ocrService';

export const ScannerScreen = ({ navigation }: any) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      processImage(uri);
    }
  };

  const processImage = async (uri: string) => {
    setLoading(true);
    const data = await simulateOcr(uri);
    setResult(data);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ESCANEADOR IA</Text>

        {!image && !loading && (
          <BrutalCard style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              SELECCIONA UN COMPROBANTE DE TRANSFERENCIA PARA ANALIZAR
            </Text>
            <BrutalButton 
              title="Elegir Imagen" 
              onPress={pickImage} 
              style={{ marginTop: 20 }}
            />
          </BrutalCard>
        )}

        {loading && (
          <BrutalCard backgroundColor={theme.colors.accent} style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loaderText}>ANALIZANDO COMPROBANTE...</Text>
            <Text style={styles.loaderSubtext}>EXTRAYENDO MONTO, RUT Y FECHA</Text>
          </BrutalCard>
        )}

        {result && !loading && (
          <View>
            <BrutalCard backgroundColor={theme.colors.primary} style={styles.resultCard}>
              <Text style={styles.resultLabel}>MONTO DETECTADO</Text>
              <Text style={styles.resultAmount}>${result.amount.toLocaleString('es-CL')}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>BANCO:</Text>
                <Text style={styles.dataValue}>{result.bank}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>FECHA:</Text>
                <Text style={styles.dataValue}>{result.date}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>RUT RECEPTOR:</Text>
                <Text style={styles.dataValue}>{result.rut}</Text>
              </View>
            </BrutalCard>

            <BrutalButton 
              title="Confirmar y Guardar" 
              onPress={() => navigation.navigate('HOME')} 
              style={{ marginTop: 20 }}
            />
            <BrutalButton 
              title="Reintentar" 
              onPress={() => {
                setResult(null);
                setImage(null);
              }} 
              color={theme.colors.secondary}
              style={{ marginTop: 10 }}
            />
          </View>
        )}

        <BrutalButton 
          title="Volver" 
          onPress={() => navigation.goBack()} 
          color="#333"
          textStyle={{ color: '#FFF' }}
          style={{ marginTop: 'auto', marginBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 54,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  placeholderCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  loaderCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loaderText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 18,
    marginTop: 20,
  },
  loaderSubtext: {
    color: '#000',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 5,
  },
  resultCard: {
    marginBottom: theme.spacing.md,
  },
  resultLabel: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  resultAmount: {
    color: '#000',
    fontSize: 48,
    fontWeight: '900',
  },
  divider: {
    height: 3,
    backgroundColor: '#000',
    marginVertical: theme.spacing.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  dataLabel: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  dataValue: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});
