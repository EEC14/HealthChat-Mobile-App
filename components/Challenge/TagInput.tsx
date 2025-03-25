import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  colors: any;
}

const TagInput: React.FC<TagInputProps> = ({ tags, setTags, colors }) => {
  const [tagInput, setTagInput] = useState<string>('');

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { borderColor: colors.primary, color: '#000000' }]}
          placeholder="Add up to 5 tags (e.g., fitness, daily)"
          placeholderTextColor="#999"
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={handleAddTag}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddTag}
          disabled={tags.length >= 5 || !tagInput.trim()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveTag(index)}
            >
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      <Text style={styles.hint}>
        {tags.length < 5 
          ? `${5 - tags.length} more tag${5 - tags.length !== 1 ? 's' : ''} allowed`
          : 'Maximum number of tags reached'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 8,
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#00838f',
  },
  removeButton: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default TagInput;