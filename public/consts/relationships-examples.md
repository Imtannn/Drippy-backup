# Data Relationships Documentation

This document explains how Templates, Blocks, and Fabrics relate to each other in the Drippy system.

## 📊 Overview

```
Templates ←→ Fabrics (via materialId)
    ↓
  Blocks (via templateName/templateCategory)
```

## 🔗 Relationship Types

### 1. Template → Fabric Relationship

Templates reference fabrics through `materialId`:

```typescript
// Template
{
  _id: '20',
  name: 'Item 1',
  category: 'Shirt',
  materialId: '145 Cotton'  // ← References fabric
}

// Matching Fabric
{
  _id: '3',
  materialName: '145',      // ← Combined with category
  category: 'Cotton',       // ← to form "145 Cotton"
  templateCategory: 'Shirt'
}
```

**Relationship**: `template.materialId === "${fabric.materialName} ${fabric.category}"`

### 2. Block → Template Relationship

Blocks belong to templates through `templateName` and `templateCategory`:

```typescript
// Template
{
  _id: '20',
  name: 'Item 1',
  category: 'Shirt'
}

// Blocks belonging to this template
{
  _id: '24',
  blockName: 'Sleeves 1291',
  category: 'Sleeves',
  templateName: 'Item 1',        // ← References template
  templateCategory: 'Shirt'      // ← Must match
}
{
  _id: '25',
  blockName: 'Bodice 1289',
  category: 'Bodice',
  templateName: 'Item 1',        // ← Same template
  templateCategory: 'Shirt'      // ← Same category
}
```

**Relationship**: `block.templateName === template.name && block.templateCategory === template.category`

### 3. Fabric → Template Category Relationship

Fabrics are organized by template categories:

```typescript
// Jacket Fabrics
{
  materialName: '56',
  category: 'Wool',
  templateCategory: 'Jacket'  // ← For Jacket templates
}

// Shirt Fabrics
{
  materialName: '145',
  category: 'Cotton',
  templateCategory: 'Shirt'   // ← For Shirt templates
}
```

## 🏗️ Complete Data Structure Example

For Template "Item 1" (Shirt):

```typescript
{
  template: {
    _id: '20',
    name: 'Item 1',
    category: 'Shirt',
    materialId: '145 Cotton'
  },
  fabric: {
    _id: '3',
    materialName: '145',
    category: 'Cotton',
    templateCategory: 'Shirt',
    thumb: 'https://.../145%20Cotton.png',
    normal: 'https://.../Normal.png',
    baseColor: 'https://.../BaseColor.png',
    // ... other texture files
  },
  blocks: [
    {
      _id: '24',
      blockName: 'Sleeves 1291',
      category: 'Sleeves',
      templateName: 'Item 1',
      templateCategory: 'Shirt',
      modelFile: 'https://.../Sleeves%201291.gltf'
    },
    {
      _id: '25',
      blockName: 'Bodice 1289',
      category: 'Bodice',
      templateName: 'Item 1',
      templateCategory: 'Shirt',
      modelFile: 'https://.../Bodice%201289.gltf'
    }
  ]
}
```

## 📋 Block Categories

Blocks are categorized by clothing components:

- **Bodice**: Main body/torso part
- **Sleeves**: Arm covering parts
- **Pants**: Leg covering parts

Each template can have multiple blocks of different categories.

## 🎨 Fabric Usage

Fabrics provide material properties for templates:

- **Thumbnail**: Preview image (`${materialName} ${category}.png`)
- **Textures**:
  - Normal map (`Normal.png`)
  - Base color (`BaseColor.png`)
  - Displacement (`Displacement.png`)
  - Roughness (`Roughness.png`)

## 🔍 Usage Examples

### Find Fabric for Template
```typescript
import { getFabricForTemplate } from './relationships'

const template = templates.moidien.find(t => t.name === 'Item 1')
const fabric = getFabricForTemplate(template)
// Returns fabric with materialName='145', category='Cotton'
```

### Get All Blocks for Template
```typescript
import { getBlocksForTemplate } from './relationships'

const template = templates.moidien.find(t => t.name === 'Item 1')
const blocks = getBlocksForTemplate(template)
// Returns [Sleeves 1291, Bodice 1289]
```

### Get Complete Template Data
```typescript
import { getCompleteTemplateData } from './relationships'

const completeData = getCompleteTemplateData('20') // Template ID
// Returns { template, fabric, blocks, blocksByCategory }
```

### Validate Relationships
```typescript
import { validateRelationships } from './relationships'

const validation = validateRelationships()
if (!validation.valid) {
  console.log('Issues found:', validation.issues)
}
```

## 📈 Data Summary

Current data structure contains:
- **20 Templates** across 3 categories (Jacket, Shirt, Pants)
- **25 Blocks** of 3 types (Bodice, Sleeves, Pants)
- **4 Fabrics** for different template categories

Use `getDataSummary()` for detailed statistics.
