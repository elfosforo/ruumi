import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Image } from 'react-native';
import { useTheme } from '../styles/ThemeContext';
import { clearAllData, getHouses, getCurrentHouseId, setCurrentHouseId, addHouse, exportBackup, importBackup, House, getExpenses, getRoomies } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalPressable } from '../components/BrutalPressable';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const logo6 = require('../../assets/Logo/1x/Recurso 6.png');

export const ProfileScreen = ({ navigation }: any) => {
  const { theme, colors, toggleTheme } = useTheme();
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Multi-house state
  const [houses, setHouses] = useState<House[]>([]);
  const [currentHouseId, setCurrentHouseIdState] = useState<string>('');
  const [showAddHouseModal, setShowAddHouseModal] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');

  // Stats state
  const [roomiesCount, setRoomiesCount] = useState(0);
  const [totalMonthExpenses, setTotalMonthExpenses] = useState(0);

  const loadHousesData = async () => {
    const list = await getHouses();
    const activeId = await getCurrentHouseId();
    setHouses(list);
    setCurrentHouseIdState(activeId);

    const roomiesList = await getRoomies();
    const expensesList = await getExpenses();
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTotal = expensesList.reduce((sum, exp) => {
      if (!exp.date) return sum;
      const parts = exp.date.split(/[/-]/).map(Number);
      if (parts.length < 3) return sum;
      const [, month, year] = parts;
      if ((month - 1) === currentMonth && year === currentYear) {
        return sum + exp.amount;
      }
      return sum;
    }, 0);

    setRoomiesCount(roomiesList.length);
    setTotalMonthExpenses(monthlyTotal);
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHousesData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSwitchHouse = async (id: string) => {
    await setCurrentHouseId(id);
    await loadHousesData();
    Alert.alert('Casa Cambiada', 'Ahora estás visualizando los datos de esta casa.');
  };

  const handleAddHouse = async () => {
    if (!newHouseName.trim()) {
      Alert.alert('Error', 'Escribe un nombre para la casa');
      return;
    }
    const created = await addHouse(newHouseName.trim());
    await setCurrentHouseId(created.id);
    await loadHousesData();
    setShowAddHouseModal(false);
    setNewHouseName('');
    Alert.alert('Éxito', `Se ha creado la casa "${created.name}" y se ha establecido como activa.`);
  };

  const handleExportBackup = async () => {
    try {
      const backupJson = await exportBackup();
      const fileUri = FileSystem.cacheDirectory + 'ruumi_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, backupJson, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Exportar Respaldo Ruumi' });
      } else {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el respaldo');
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const fileUri = result.assets[0].uri;
      const backupJson = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
      const success = await importBackup(backupJson);
      if (success) {
        Alert.alert('Éxito', 'El respaldo se ha importado correctamente.');
        await loadHousesData();
        navigation.reset({
          index: 0,
          routes: [{ name: 'HOME' }],
        });
      } else {
        Alert.alert('Error', 'El archivo seleccionado no tiene un formato válido de respaldo de Ruumi.');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo leer o importar el archivo de respaldo');
    }
  };

  const handleReset = async () => {
    if (confirmText === 'ELIMINAR') {
      await clearAllData();
      setShowResetModal(false);
      setConfirmText('');
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

        {/* Casas Management */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MIS CASAS / DEPTOS</Text>
          <View style={{ gap: 10, marginBottom: 15 }}>
            {houses.map((h) => {
              const isActive = h.id === currentHouseId;
              return (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => handleSwitchHouse(h.id)}
                  style={[
                    styles.houseItem,
                    { borderColor: colors.border, backgroundColor: isActive ? colors.accent : colors.background }
                  ]}
                >
                  <Ionicons name="home" size={18} color={isActive ? '#000' : colors.text} />
                  <Text style={[styles.houseText, { color: isActive ? '#000' : colors.text, fontWeight: isActive ? '900' : '700' }]}>
                    {h.name.toUpperCase()}
                  </Text>
                  {isActive && <Ionicons name="checkmark-circle" size={18} color="#000" style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <BrutalPressable
            onPress={() => setShowAddHouseModal(true)}
            style={{ height: 48 }}
            contentStyle={[styles.addHouseBtn, { backgroundColor: colors.primary, borderColor: colors.border }]}
          >
            <Ionicons name="add-circle-outline" size={20} color="#000" />
            <Text style={styles.addHouseBtnText}>CREAR NUEVA CASA</Text>
          </BrutalPressable>
        </View>

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

        {/* Info Section / Resumen de la casa */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>RESUMEN DE LA CASA</Text>
          <View style={styles.menuItem}>
            <Ionicons name="people-outline" size={22} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              {roomiesCount} Roomie{roomiesCount !== 1 ? 's' : ''} registrado{roomiesCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.menuItem}>
            <Ionicons name="cash-outline" size={22} color={colors.accent} />
            <Text style={[styles.menuText, { color: colors.text }]}>
              Gastos del mes: ${totalMonthExpenses.toLocaleString('es-CL')}
            </Text>
          </View>
        </View>

        {/* Backup & Restore */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 20 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>RESPALDO DE DATOS</Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 0, paddingVertical: 10 }]} 
              onPress={handleExportBackup}
            >
              <Ionicons name="cloud-upload-outline" size={22} color={colors.accent} />
              <Text style={[styles.menuText, { color: colors.text }]}>Exportar Copia de Seguridad</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 0, paddingVertical: 10 }]} 
              onPress={handleImportBackup}
            >
              <Ionicons name="cloud-download-outline" size={22} color={colors.accent} />
              <Text style={[styles.menuText, { color: colors.text }]}>Importar Copia de Seguridad</Text>
            </TouchableOpacity>
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
            <Image 
              source={logo6} 
              style={styles.footerLogo} 
              resizeMode="contain" 
            />
            <Text style={[styles.version, { color: colors.textSecondary, marginTop: 5 }]}>v1.0.1</Text>
          </View>
        </View>
      </ScrollView>

      {/* Add House Modal */}
      <Modal visible={showAddHouseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>NUEVA CASA</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Registra una nueva propiedad o grupo de gastos. Cada casa tiene sus propios roomies y contabilidad.
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Ej. Casa de la Playa, Depto 504..."
              placeholderTextColor="#666"
              value={newHouseName}
              onChangeText={setNewHouseName}
            />
            <View style={styles.modalButtons}>
              <BrutalButton 
                title="CREAR CASA" 
                onPress={handleAddHouse} 
                color={colors.primary} 
              />
              <TouchableOpacity onPress={() => setShowAddHouseModal(false)} style={styles.cancelLink}>
                <Text style={{ color: colors.textSecondary, fontWeight: '800' }}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal visible={showResetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="warning" size={50} color={colors.secondary} style={{ alignSelf: 'center' }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>¡ADVERTENCIA!</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Esta acción borrará todos los gastos, roomies y saldos de todas las casas de forma permanente.
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
  footerLogo: { width: 100, height: 32 },
  version: { fontSize: 10, fontWeight: '800' },
  
  // House styles
  houseItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 2, borderRadius: 10, gap: 10 },
  houseText: { fontSize: 13, fontWeight: '800' },
  addHouseBtn: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2 },
  addHouseBtnText: { fontWeight: '900', fontSize: 12, color: '#000' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 30, borderWidth: 4 },
  modalTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  modalDesc: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginVertical: 15 },
  modalLabel: { fontSize: 10, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  modalInput: { borderWidth: 3, padding: 15, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  modalButtons: { gap: 10 },
  cancelLink: { alignItems: 'center', marginTop: 10 }
});
