import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Camera, CameraView, CameraType, BarcodeScanningResult } from 'expo-camera';
import { 
  searchFoodByName, 
  scanBarcode,
  createCustomFoodItem
} from '../../utils/foodRecognitionService';
import { FoodItem } from '../../types/NutritionTypes';
import { Ionicons } from '@expo/vector-icons';

// Fallback primary color if Colors can't be accessed
const PRIMARY_COLOR = '#2196F3';

interface FoodScannerProps {
  onFoodDetected: (food: FoodItem) => void;
  onClose: () => void;
}

const FoodScanner: React.FC<FoodScannerProps> = ({ onFoodDetected, onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [matchingFoods, setMatchingFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isManualAddModalVisible, setIsManualAddModalVisible] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: ''
  });
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    // Search for matching foods when searchText changes
    const searchFoods = async () => {
      if (searchText.length > 2) {
        try {
          const results = await searchFoodByName(searchText);
          setMatchingFoods(results);
        } catch (error) {
          console.error('Error searching foods:', error);
          setMatchingFoods([]);
        }
      } else {
        setMatchingFoods([]);
      }
    };

    searchFoods();
  }, [searchText]);

  const handleBarCodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (scanned || isProcessing) return;
    
    const { data } = scanningResult;
    
    setScanned(true);
    setIsProcessing(true);
    
    try {
      // Process barcode data
      const foodItem = await scanBarcode(data);
      
      if (foodItem) {
        setSelectedFood(foodItem);
      } else {
        Alert.alert(
          'Product Not Found',
          'This barcode is not in our database. Please try searching for the food manually or add it custom.',
          [{ text: 'OK' }]
        );
        setScanned(false);
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      Alert.alert('Error', 'Failed to scan barcode. Please try again.');
      setScanned(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectFood = async (foodItem: FoodItem) => {
    setSelectedFood(foodItem);
    setMatchingFoods([]);
    setSearchText(foodItem.name);
  };

  const confirmFood = () => {
    if (selectedFood) {
      onFoodDetected(selectedFood);
    }
  };

  const resetScan = () => {
    setScanned(false);
    setSelectedFood(null);
    setSearchText('');
  };

  const handleManualFoodAdd = () => {
    try {
      const newFood = createCustomFoodItem({
        name: customFood.name,
        calories: parseFloat(customFood.calories) || 0,
        protein: parseFloat(customFood.protein) || 0,
        carbs: parseFloat(customFood.carbs) || 0,
        fat: parseFloat(customFood.fat) || 0,
        servingSize: customFood.servingSize || '1 serving'
      });
      
      onFoodDetected(newFood);
      setIsManualAddModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Invalid food item details');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: PRIMARY_COLOR }]} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Food</Text>
        <TouchableOpacity onPress={() => setIsManualAddModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {!selectedFood ? (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a food..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {matchingFoods.length > 0 ? (
            <FlatList
              data={matchingFoods}
              keyExtractor={(item) => item.id}
              style={styles.searchResults}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.searchResultItem}
                  onPress={() => handleSelectFood(item)}
                >
                  <Text style={styles.searchResultText}>{item.name}</Text>
                  <Text style={styles.searchResultDetails}>
                    {item.calories} cal • {item.servingSize}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.scannerContainer}>
                <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: [
                    'upc_a', 
                    'upc_e', 
                    'ean13', 
                    'ean8'
                    ]
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                >
                <View style={styles.overlay}>
                    <View style={[styles.scannerBox, { borderColor: PRIMARY_COLOR }]}>
                    <Text style={styles.scanInstructions}>
                        Scan a barcode or search above
                    </Text>
                    </View>
                </View>
                </CameraView>
            </View>
          )}
        </>
      ) : (
        <View style={styles.detailsContainer}>
          <View style={styles.foodDetails}>
            <Text style={styles.foodName}>{selectedFood.name}</Text>
            <Text style={styles.servingSize}>{selectedFood.servingSize}</Text>
            
            <View style={styles.nutritionRow}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedFood.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedFood.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedFood.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{selectedFood.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
            
            {selectedFood.fiber !== undefined && (
              <View style={styles.additionalNutrition}>
                <Text style={styles.additionalNutritionText}>
                  Fiber: {selectedFood.fiber}g
                  {selectedFood.sugar !== undefined && ` • Sugar: ${selectedFood.sugar}g`}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={resetScan}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: PRIMARY_COLOR }]} 
              onPress={confirmFood}
            >
              <Text style={styles.confirmButtonText}>Add to Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Manual Food Add Modal */}
      <Modal
        visible={isManualAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsManualAddModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.manualAddModal}>
            <Text style={styles.manualAddTitle}>Add Custom Food</Text>
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Food Name"
              value={customFood.name}
              onChangeText={(text) => setCustomFood(prev => ({...prev, name: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Calories"
              keyboardType="numeric"
              value={customFood.calories}
              onChangeText={(text) => setCustomFood(prev => ({...prev, calories: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Protein (g)"
              keyboardType="numeric"
              value={customFood.protein}
              onChangeText={(text) => setCustomFood(prev => ({...prev, protein: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Carbs (g)"
              keyboardType="numeric"
              value={customFood.carbs}
              onChangeText={(text) => setCustomFood(prev => ({...prev, carbs: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Fat (g)"
              keyboardType="numeric"
              value={customFood.fat}
              onChangeText={(text) => setCustomFood(prev => ({...prev, fat: text}))}
            />
            
            <TextInput
              style={styles.manualAddInput}
              placeholder="Serving Size (optional)"
              value={customFood.servingSize}
              onChangeText={(text) => setCustomFood(prev => ({...prev, servingSize: text}))}
            />
            
            <View style={styles.manualAddButtons}>
              <TouchableOpacity 
                style={styles.manualAddCancelButton}
                onPress={() => setIsManualAddModalVisible(false)}
              >
                <Text style={styles.manualAddCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.manualAddConfirmButton, { backgroundColor: PRIMARY_COLOR }]}
                onPress={handleManualFoodAdd}
              >
                <Text style={styles.manualAddConfirmButtonText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanInstructions: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
    backgroundColor: '#111',
  },
  searchResultItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchResultText: {
    color: '#fff',
    fontSize: 16,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  foodDetails: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 20,
  },
  foodName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  servingSize: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 20,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#444',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutritionLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#444',
  },
  additionalNutrition: {
    marginTop: 16,
  },
  additionalNutritionText: {
    color: '#aaa',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  manualAddModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  manualAddTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  manualAddInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  manualAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  manualAddCancelButton: {
    flex: 1,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
  },
  manualAddCancelButtonText: {
    color: '#333',
  },
  manualAddConfirmButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  manualAddConfirmButtonText: {
    color: '#fff',
  },
  searchResultDetails: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    padding: 5,
  }
});

export default FoodScanner;