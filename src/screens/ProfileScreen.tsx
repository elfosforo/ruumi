import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '../styles/ThemeContext';
import { clearAllData } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalPressable } from '../components/BrutalPressable';

export const ProfileScreen = ({ navigation }: any) => {
  const { theme, colors, toggleTheme } = useTheme();
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleReset = async () => {
    if (confirmText === 'ELIMINAR') {
      await clearAllData();
      setShowResetModal(false);
      setConfirmText('');
      // Force app reset by navigating to HOME which will re-init roomies
      navigation.reset({
        index: 0,
        routes: [{ name: 'HOME' }],
      });
    } else {
      Alert.alert('Error', 'Escribe ELIMINAR para confirmar');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme === 'day' ? '#000' : colors.primary }]}>PERFIL</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>CONFIGURACIÓN DE LA CASA</Text>

        {/* Theme Toggle Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SISTEMA VISUAL</Text>
          <BrutalPressable 
            onPress={toggleTheme}
            style={styles.toggleWrapper}
            contentStyle={[
              styles.toggleBtn, 
              { backgroundColor: theme === 'day' ? colors.accent : colors.background }
            ]}
          >
            <Ionicons 
              name={theme === 'day' ? "sunny" : "moon"} 
              size={24} 
              color={theme === 'day' ? "#FFF" : colors.primary} 
            />
            <Text style={[styles.toggleText, { color: theme === 'day' ? "#FFF" : colors.text }]}>
              MODO {theme === 'night' ? 'NOCHE' : 'DÍA'}
            </Text>
          </BrutalPressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>INFORMACIÓN</Text>
          <View style={styles.menuItem}>
            <Ionicons name="home-outline" size={22} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>Depto 402 - Santiago</Text>
          </View>
          <View style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>Seguridad Local (Sin Nube)</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>ZONA DE PELIGRO</Text>
          <TouchableOpacity 
            style={[styles.resetBtn, { borderColor: colors.secondary }]}
            onPress={() => setShowResetModal(true)}
          >
            <Ionicons name="trash-bin-outline" size={20} color={colors.secondary} />
            <Text style={[styles.resetBtnText, { color: colors.secondary }]}>BORRAR TODOS LOS DATOS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <Text style={[styles.version, { color: colors.textSecondary }]}>RUUMI v1.0.1</Text>
          </View>
        </View>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal visible={showResetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="warning" size={50} color={colors.secondary} style={{ alignSelf: 'center' }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>¡ADVERTENCIA!</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Esta acción borrará todos los gastos, roomies y saldos de forma permanente.
            </Text>
            
            <Text style={[styles.modalLabel, { color: colors.secondary }]}>ESCRIBE "ELIMINAR" PARA CONFIRMAR:</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Escribir aquí..."
              placeholderTextColor="#444"
              autoCapitalize="characters"
              value={confirmText}
              onChangeText={setConfirmText}
            />

            <View style={styles.modalButtons}>
              <BrutalButton 
                title="ELIMINAR TODO" 
                onPress={handleReset} 
                color={confirmText === 'ELIMINAR' ? colors.secondary : '#333'} 
              />
              <TouchableOpacity onPress={() => setShowResetModal(false)} style={styles.cancelLink}>
                <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 40 },
  title: { fontSize: 36, fontWeight: '900' },
  subtitle: { fontSize: 12, fontWeight: '800', marginBottom: 30 },
  section: { borderRadius: 20, padding: 20, borderWidth: 3 },
  sectionLabel: { fontSize: 10, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  toggleWrapper: { height: 60 },
  toggleBtn: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  toggleText: { fontWeight: '900', fontSize: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#33333322' },
  menuText: { fontSize: 14, fontWeight: '700', marginLeft: 15 },
  dangerZone: { marginTop: 40, borderTopWidth: 2, borderTopColor: '#333', paddingTop: 20 },
  dangerTitle: { color: '#555', fontSize: 12, fontWeight: '900', marginBottom: 15 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderWidth: 3, gap: 10 },
  resetBtnText: { fontWeight: '900', fontSize: 14 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerInner: { alignItems: 'center' },
  version: { fontSize: 10, fontWeight: '800' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 30, borderWidth: 4 },
  modalTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  modalDesc: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginVertical: 15 },
  modalLabel: { fontSize: 10, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  modalInput: { borderWidth: 3, padding: 15, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  modalButtons: { gap: 10 },
  cancelLink: { alignItems: 'center', marginTop: 10 }
});
