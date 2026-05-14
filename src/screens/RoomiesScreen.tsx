import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../styles/ThemeContext';
import { getRoomies, saveRoomies, Roomie, updateCreditLimit } from '../services/storageService';
import { Ionicons } from '@expo/vector-icons';
import { BrutalButton } from '../components/BrutalButton';

export const RoomiesScreen = () => {
  const { colors, spacing, borders } = useTheme();
  const [roomies, setRoomies] = useState<Roomie[]>([]);
  const [newName, setNewName] = useState('');
  const [editingRoomie, setEditingRoomie] = useState<Roomie | null>(null);
  const [tempLimit, setTempLimit] = useState('');

  const loadRoomies = async () => {
    const data = await getRoomies();
    setRoomies(data);
  };

  useEffect(() => {
    loadRoomies();
  }, []);

  const addRoomie = async () => {
    if (!newName) return;
    const colorsList = [colors.accent, colors.secondary, colors.primary, '#A0FF00', '#FF8000'];
    const newRoomie: Roomie = {
      id: Date.now().toString(),
      name: newName,
      color: colorsList[roomies.length % colorsList.length],
      balance: 0,
      creditLimit: 200000,
      currentCredit: 200000,
      totalContributed: 0,
      totalResponsibilities: 0
    };
    const updated = [...roomies, newRoomie];
    setRoomies(updated);
    await saveRoomies(updated);
    setNewName('');
  };

  const removeRoomie = async (id: string) => {
    const updated = roomies.filter(r => r.id !== id);
    setRoomies(updated);
    await saveRoomies(updated);
  };

  const saveLimit = async () => {
    if (!editingRoomie) return;
    const newLimit = parseInt(tempLimit);
    if (isNaN(newLimit)) return;

    if (newLimit < 200000) {
      alert("El límite mínimo es de $200.000 CLP");
      return;
    }

    await updateCreditLimit(editingRoomie.id, newLimit);
    await loadRoomies();
    setEditingRoomie(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.primary }]}>ROOMIES</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>GESTIONA CRÉDITOS Y MIEMBROS</Text>

        <View style={styles.addSection}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Nombre del nuevo roomie..."
            placeholderTextColor={colors.textSecondary}
            value={newName}
            onChangeText={setNewName}
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary, borderColor: colors.border }]} 
            onPress={addRoomie}
          >
            <Ionicons name="add" size={32} color={colors.background === '#FFFFFF' || colors.background === '#F0F4F8' ? '#FFF' : '#000'} />
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {roomies.map((roomie) => (
            <TouchableOpacity 
              key={roomie.id} 
              style={[styles.roomieCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setEditingRoomie(roomie);
                setTempLimit(roomie.creditLimit.toString());
              }}
            >
              <View style={[styles.avatar, { backgroundColor: roomie.color, borderColor: colors.border }]}>
                <Text style={styles.initials}>{roomie.name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]}>{roomie.name.toUpperCase()}</Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {roomie.currentCredit <= 0 && (
                      <View style={[styles.warningBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={styles.warningText}>CRÍTICO</Text>
                      </View>
                    )}
                    <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>EDITAR CRÉDITO</Text>
                  </View>
                </View>
                
                <Text style={[styles.creditValue, { color: roomie.currentCredit <= 0 ? colors.secondary : colors.textSecondary }]}>
                  ${roomie.currentCredit.toLocaleString('es-CL')} / ${roomie.creditLimit.toLocaleString('es-CL')}
                </Text>
                
                <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                  <View style={[styles.progressFill, { 
                    backgroundColor: roomie.currentCredit <= (roomie.creditLimit * 0.1) ? colors.secondary : colors.accent,
                    width: `${Math.min(100, Math.max(0, (roomie.currentCredit / roomie.creditLimit) * 100))}%` 
                  }]} />
                </View>
              </View>
              {roomie.id !== '1' && (
                <TouchableOpacity onPress={() => removeRoomie(roomie.id)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Edit Credit Modal */}
      <Modal visible={!!editingRoomie} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.primary }]}>EDITAR CRÉDITO</Text>
            <Text style={[styles.modalSubtitle, { color: colors.text }]}>{editingRoomie?.name.toUpperCase()}</Text>
            
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>NUEVO LÍMITE MENSUAL ($)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              value={tempLimit}
              onChangeText={setTempLimit}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <BrutalButton title="GUARDAR" onPress={saveLimit} color={colors.accent} />
              <TouchableOpacity onPress={() => setEditingRoomie(null)} style={styles.cancelModal}>
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
  scrollContent: { paddingTop: 40 },
  title: { fontSize: 36, fontWeight: '900' },
  subtitle: { fontSize: 12, fontWeight: '800', marginBottom: 30 },
  addSection: { flexDirection: 'row', marginBottom: 30 },
  input: { flex: 1, borderRadius: 12, padding: 15, fontSize: 16, fontWeight: '700', marginRight: 10, borderWidth: 2 },
  addButton: { borderRadius: 12, width: 54, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  list: { gap: 15 },
  roomieCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20, borderWidth: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 2 },
  initials: { color: '#000', fontWeight: '900', fontSize: 18 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  name: { fontWeight: '900', fontSize: 16 },
  creditLabel: { fontWeight: '800', fontSize: 8 },
  creditValue: { fontWeight: '900', fontSize: 14, marginTop: 4 },
  progressBar: { height: 8, borderRadius: 4, marginTop: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  progressFill: { height: '100%', borderRadius: 4 },
  removeBtn: { marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 25, borderWidth: 4 },
  modalTitle: { fontSize: 24, fontWeight: '900' },
  modalSubtitle: { fontSize: 14, fontWeight: '800', marginBottom: 20 },
  modalLabel: { fontSize: 10, fontWeight: '900', marginBottom: 8 },
  modalInput: { borderWidth: 2, borderRadius: 12, padding: 15, fontSize: 24, fontWeight: '900', marginBottom: 25 },
  modalButtons: { gap: 10 },
  cancelModal: { padding: 10, alignItems: 'center' },
  warningBadge: { backgroundColor: '#FF007A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  warningText: { color: '#FFF', fontSize: 8, fontWeight: '900' }
});
