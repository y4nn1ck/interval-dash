
interface FitRecord {
  timestamp?: number;
  power?: number;
  cadence?: number;
  [key: string]: any;
}

interface ParsedFitData {
  records: FitRecord[];
  duration: number; // in seconds
}

interface FitDefinition {
  localMessageType: number;
  globalMessageNumber: number;
  fields: Array<{
    fieldDefNum: number;
    size: number;
    baseType: number;
  }>;
}

export const parseFitFile = async (file: File): Promise<ParsedFitData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);
        
        console.log('FIT file size:', arrayBuffer.byteLength);
        
        // Check FIT file header (14 bytes)
        if (arrayBuffer.byteLength < 14) {
          throw new Error('File too small to be a valid FIT file');
        }
        
        const headerSize = dataView.getUint8(0);
        const protocolVersion = dataView.getUint8(1);
        const profileVersion = dataView.getUint16(2, true);
        const dataSize = dataView.getUint32(4, true);
        
        // Check for FIT signature '.FIT'
        const signature = String.fromCharCode(
          dataView.getUint8(8),
          dataView.getUint8(9),
          dataView.getUint8(10),
          dataView.getUint8(11)
        );
        
        console.log('FIT Header:', { headerSize, protocolVersion, profileVersion, dataSize, signature });
        
        if (signature !== '.FIT') {
          throw new Error('Invalid FIT file signature');
        }
        
        const records: FitRecord[] = [];
        const definitions: Map<number, FitDefinition> = new Map();
        let offset = headerSize;
        let startTimestamp: number | null = null;
        
        while (offset < headerSize + dataSize && offset < arrayBuffer.byteLength) {
          const recordHeader = dataView.getUint8(offset);
          offset++;
          
          if (recordHeader & 0x80) {
            // Compressed timestamp header
            const timeOffset = recordHeader & 0x1F;
            const localMessageType = (recordHeader >> 5) & 0x3;
            
            const definition = definitions.get(localMessageType);
            if (definition && offset + getMessageSize(definition) <= arrayBuffer.byteLength) {
              const record = parseDataMessage(dataView, offset, definition);
              if (record && startTimestamp !== null) {
                record.timestamp = startTimestamp + timeOffset;
                records.push(record);
              }
              offset += getMessageSize(definition);
            } else {
              offset++;
            }
          } else {
            // Normal record header
            const messageType = recordHeader & 0x0F;
            const localMessageType = (recordHeader >> 4) & 0x0F;
            
            if (messageType === 1) {
              // Definition message
              try {
                const definition = parseDefinitionMessage(dataView, offset);
                if (definition) {
                  definitions.set(localMessageType, definition);
                  const defSize = getDefinitionMessageSize(dataView, offset);
                  offset += defSize;
                } else {
                  offset++;
                }
              } catch (e) {
                console.log('Error parsing definition message:', e);
                offset++;
              }
            } else if (messageType === 0) {
              // Data message
              const definition = definitions.get(localMessageType);
              if (definition && offset + getMessageSize(definition) <= arrayBuffer.byteLength) {
                const record = parseDataMessage(dataView, offset, definition);
                if (record) {
                  if (startTimestamp === null && record.timestamp) {
                    startTimestamp = record.timestamp;
                  }
                  records.push(record);
                }
                offset += getMessageSize(definition);
              } else {
                offset++;
              }
            } else {
              offset++;
            }
          }
          
          // Safety check to prevent infinite loops
          if (offset >= arrayBuffer.byteLength) break;
        }
        
        console.log(`Parsed ${records.length} records from FIT file`);
        
        if (records.length === 0) {
          throw new Error('No valid records found in FIT file');
        }
        
        // Calculate duration from timestamps
        const validTimestamps = records
          .map(r => r.timestamp)
          .filter(t => t !== undefined) as number[];
        
        const duration = validTimestamps.length > 1 
          ? Math.max(...validTimestamps) - Math.min(...validTimestamps)
          : records.length;
        
        console.log('FIT file parsing completed:', { recordCount: records.length, duration });
        
        resolve({
          records,
          duration
        });
        
      } catch (error) {
        console.error('Error parsing FIT file:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

function parseDefinitionMessage(dataView: DataView, offset: number): FitDefinition | null {
  try {
    if (offset + 5 >= dataView.byteLength) return null;
    
    const reserved = dataView.getUint8(offset);
    const architecture = dataView.getUint8(offset + 1);
    const globalMessageNumber = dataView.getUint16(offset + 2, architecture === 0);
    const numFields = dataView.getUint8(offset + 4);
    
    if (numFields > 50 || offset + 5 + (numFields * 3) > dataView.byteLength) {
      return null;
    }
    
    const fields = [];
    let fieldOffset = offset + 5;
    
    for (let i = 0; i < numFields; i++) {
      if (fieldOffset + 3 > dataView.byteLength) break;
      
      const fieldDefNum = dataView.getUint8(fieldOffset);
      const size = dataView.getUint8(fieldOffset + 1);
      const baseType = dataView.getUint8(fieldOffset + 2);
      
      // Validate field size
      if (size > 0 && size <= 255) {
        fields.push({
          fieldDefNum,
          size,
          baseType
        });
      }
      
      fieldOffset += 3;
    }
    
    return {
      localMessageType: 0,
      globalMessageNumber,
      fields
    };
  } catch (e) {
    console.log('Error in parseDefinitionMessage:', e);
    return null;
  }
}

function getDefinitionMessageSize(dataView: DataView, offset: number): number {
  try {
    if (offset + 5 > dataView.byteLength) return 1;
    const numFields = dataView.getUint8(offset + 4);
    if (numFields > 50) return 1;
    return 5 + (numFields * 3);
  } catch (e) {
    return 1;
  }
}

function parseDataMessage(dataView: DataView, offset: number, definition: FitDefinition): FitRecord | null {
  const record: FitRecord = {};
  let fieldOffset = offset;
  
  try {
    for (const field of definition.fields) {
      if (fieldOffset + field.size > dataView.byteLength) break;
      
      let value: number | undefined;
      
      // Parse based on field size
      if (field.size === 1) {
        value = dataView.getUint8(fieldOffset);
        if (value === 0xFF) value = undefined;
      } else if (field.size === 2) {
        value = dataView.getUint16(fieldOffset, true);
        if (value === 0xFFFF) value = undefined;
      } else if (field.size === 4) {
        value = dataView.getUint32(fieldOffset, true);
        if (value === 0xFFFFFFFF) value = undefined;
      }
      
      // Map field definition numbers to known fields for Record messages (20)
      if (definition.globalMessageNumber === 20 && value !== undefined) {
        switch (field.fieldDefNum) {
          case 253: // timestamp
            record.timestamp = value;
            break;
          case 7: // power
            if (value < 2000) {
              record.power = value;
            }
            break;
          case 3: // cadence
            if (value < 200) {
              record.cadence = value;
            }
            break;
        }
      }
      
      fieldOffset += field.size;
    }
  } catch (e) {
    console.log('Error parsing data message:', e);
    return null;
  }
  
  // Only return record if it has meaningful data
  if (record.timestamp || record.power || record.cadence) {
    return record;
  }
  
  return null;
}

function getMessageSize(definition: FitDefinition): number {
  return definition.fields.reduce((sum, field) => sum + field.size, 0);
}
